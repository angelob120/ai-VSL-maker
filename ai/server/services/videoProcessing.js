const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const puppeteer = require('puppeteer');

class VideoProcessingService {
  constructor() {
    this.outputDir = process.env.OUTPUT_DIR || './outputs';
    this.tempDir = './temp';
  }

  async ensureDirectories() {
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.mkdir(this.tempDir, { recursive: true });
  }

  /**
   * Capture scrolling website as video using Puppeteer
   */
  async captureWebsiteScroll(websiteUrl, options = {}) {
    const {
      width = 1920,
      height = 1080,
      duration = 10,
      scrollSpeed = 50
    } = options;

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height });

    try {
      await page.goto(websiteUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (error) {
      console.log(`Warning: Page load timeout for ${websiteUrl}, continuing anyway`);
    }

    // Get page height
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    
    const framesDir = path.join(this.tempDir, `frames_${uuidv4()}`);
    await fs.mkdir(framesDir, { recursive: true });

    const fps = 30;
    const totalFrames = duration * fps;
    const scrollPerFrame = (pageHeight - height) / totalFrames;

    // Capture frames while scrolling
    for (let i = 0; i < totalFrames; i++) {
      const scrollY = Math.min(i * scrollPerFrame, pageHeight - height);
      await page.evaluate((y) => window.scrollTo(0, y), scrollY);
      await new Promise(r => setTimeout(r, 1000 / fps));
      
      const frameNumber = String(i).padStart(5, '0');
      await page.screenshot({
        path: path.join(framesDir, `frame_${frameNumber}.png`),
        type: 'png'
      });
    }

    await browser.close();

    // Convert frames to video
    const outputPath = path.join(this.tempDir, `scroll_${uuidv4()}.mp4`);
    
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(path.join(framesDir, 'frame_%05d.png'))
        .inputFPS(fps)
        .outputOptions([
          '-c:v libx264',
          '-pix_fmt yuv420p',
          '-preset fast',
          '-crf 23'
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Clean up frames
    const frames = await fs.readdir(framesDir);
    for (const frame of frames) {
      await fs.unlink(path.join(framesDir, frame));
    }
    await fs.rmdir(framesDir);

    return outputPath;
  }

  /**
   * Create video with website background and bubble overlay
   */
  async createBubbleVideo(options) {
    const {
      introVideoPath,
      websiteVideoPath,
      position = 'bottom_right',
      shape = 'circle',
      bubbleSize = 200,
      outputFilename
    } = options;

    await this.ensureDirectories();
    const outputPath = path.join(this.outputDir, outputFilename || `vsl_${uuidv4()}.mp4`);

    // Calculate bubble position
    const positions = {
      bottom_right: { x: 'W-w-30', y: 'H-h-30' },
      bottom_left: { x: '30', y: 'H-h-30' },
      top_right: { x: 'W-w-30', y: '30' },
      top_left: { x: '30', y: '30' }
    };

    const pos = positions[position] || positions.bottom_right;

    // Get video durations
    const introDuration = await this.getVideoDuration(introVideoPath);
    const websiteDuration = await this.getVideoDuration(websiteVideoPath);

    // Create filter for circular mask if needed
    let overlayFilter;
    if (shape === 'circle') {
      overlayFilter = `[1:v]scale=${bubbleSize}:${bubbleSize},format=rgba,geq=lum='p(X,Y)':a='if(gt(pow(X-${bubbleSize}/2,2)+pow(Y-${bubbleSize}/2,2),pow(${bubbleSize}/2,2)),0,255)'[bubble];[0:v][bubble]overlay=${pos.x}:${pos.y}:shortest=1`;
    } else {
      // Square shape
      overlayFilter = `[1:v]scale=${bubbleSize}:${bubbleSize}[bubble];[0:v][bubble]overlay=${pos.x}:${pos.y}:shortest=1`;
    }

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(websiteVideoPath)
        .input(introVideoPath)
        .complexFilter([
          overlayFilter
        ])
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          '-pix_fmt yuv420p',
          '-preset fast',
          '-crf 23',
          '-shortest'
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  /**
   * Create full VSL video (bubble intro + fullscreen transition)
   */
  async createFullVSL(options) {
    const {
      introVideoPath,
      websiteVideoPath,
      position = 'bottom_right',
      shape = 'circle',
      bubbleSize = 200,
      bubbleDuration = 5,
      outputFilename
    } = options;

    await this.ensureDirectories();
    const outputPath = path.join(this.outputDir, outputFilename || `vsl_full_${uuidv4()}.mp4`);
    const tempBubblePath = path.join(this.tempDir, `bubble_${uuidv4()}.mp4`);

    // Get intro video duration
    const introDuration = await this.getVideoDuration(introVideoPath);
    
    // Create bubble portion first (website background + bubble overlay)
    const bubbleClipDuration = Math.min(bubbleDuration, introDuration);

    const positions = {
      bottom_right: { x: 'W-w-30', y: 'H-h-30' },
      bottom_left: { x: '30', y: 'H-h-30' },
      top_right: { x: 'W-w-30', y: '30' },
      top_left: { x: '30', y: '30' }
    };

    const pos = positions[position] || positions.bottom_right;

    // Create bubble overlay video
    let overlayFilter;
    if (shape === 'circle') {
      overlayFilter = `[1:v]scale=${bubbleSize}:${bubbleSize},format=rgba,geq=lum='p(X,Y)':a='if(gt(pow(X-${bubbleSize}/2,2)+pow(Y-${bubbleSize}/2,2),pow(${bubbleSize}/2,2)),0,255)'[bubble];[0:v][bubble]overlay=${pos.x}:${pos.y}`;
    } else {
      overlayFilter = `[1:v]scale=${bubbleSize}:${bubbleSize}[bubble];[0:v][bubble]overlay=${pos.x}:${pos.y}`;
    }

    // Create bubble portion
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(websiteVideoPath)
        .input(introVideoPath)
        .complexFilter([overlayFilter])
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          '-pix_fmt yuv420p',
          '-preset fast',
          '-crf 23',
          `-t ${bubbleClipDuration}`
        ])
        .output(tempBubblePath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // If intro video is longer than bubble duration, concat with fullscreen portion
    if (introDuration > bubbleDuration) {
      const tempFullscreenPath = path.join(this.tempDir, `fullscreen_${uuidv4()}.mp4`);
      
      // Create fullscreen portion (skip first bubbleDuration seconds of intro)
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(introVideoPath)
          .inputOptions([`-ss ${bubbleDuration}`])
          .outputOptions([
            '-c:v libx264',
            '-c:a aac',
            '-pix_fmt yuv420p',
            '-preset fast',
            '-crf 23'
          ])
          .output(tempFullscreenPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      // Concatenate bubble and fullscreen
      const concatListPath = path.join(this.tempDir, `concat_${uuidv4()}.txt`);
      await fs.writeFile(concatListPath, `file '${tempBubblePath}'\nfile '${tempFullscreenPath}'`);

      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(concatListPath)
          .inputOptions(['-f concat', '-safe 0'])
          .outputOptions([
            '-c:v libx264',
            '-c:a aac',
            '-pix_fmt yuv420p',
            '-preset fast',
            '-crf 23'
          ])
          .output(outputPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      // Clean up
      await fs.unlink(tempBubblePath);
      await fs.unlink(tempFullscreenPath);
      await fs.unlink(concatListPath);
    } else {
      // Just use bubble video as final output
      await fs.rename(tempBubblePath, outputPath);
    }

    return outputPath;
  }

  /**
   * Get video duration in seconds
   */
  async getVideoDuration(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata.format.duration);
      });
    });
  }

  /**
   * Generate video for a single lead
   */
  async generateVideoForLead(options) {
    const {
      introVideoPath,
      websiteUrl,
      position,
      shape,
      bubbleSize = 200,
      bubbleDuration = 5,
      outputFilename
    } = options;

    await this.ensureDirectories();

    // Step 1: Capture website scrolling video
    console.log(`Capturing website: ${websiteUrl}`);
    const websiteVideoPath = await this.captureWebsiteScroll(websiteUrl, {
      duration: 15 // 15 seconds of scrolling
    });

    // Step 2: Create combined VSL video
    console.log('Creating VSL video...');
    const outputPath = await this.createFullVSL({
      introVideoPath,
      websiteVideoPath,
      position,
      shape,
      bubbleSize,
      bubbleDuration,
      outputFilename
    });

    // Clean up temp website video
    await fs.unlink(websiteVideoPath);

    return outputPath;
  }

  /**
   * Clean up temp files
   */
  async cleanup() {
    try {
      const files = await fs.readdir(this.tempDir);
      for (const file of files) {
        await fs.unlink(path.join(this.tempDir, file));
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

module.exports = new VideoProcessingService();
