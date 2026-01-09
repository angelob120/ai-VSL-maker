const { spawn } = require('child_process');
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
   * Execute ffmpeg command
   */
  runFFmpeg(args) {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);
      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Execute ffprobe command
   */
  runFFprobe(args) {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', args);
      let stdout = '';
      let stderr = '';

      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ffprobe.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`FFprobe exited with code ${code}: ${stderr}`));
        }
      });

      ffprobe.on('error', (err) => {
        reject(err);
      });
    });
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
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
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

    // Convert frames to video using ffmpeg
    const outputPath = path.join(this.tempDir, `scroll_${uuidv4()}.mp4`);
    
    await this.runFFmpeg([
      '-y',
      '-framerate', String(fps),
      '-i', path.join(framesDir, 'frame_%05d.png'),
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'fast',
      '-crf', '23',
      outputPath
    ]);

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

    // Create filter for circular mask if needed
    let overlayFilter;
    if (shape === 'circle') {
      overlayFilter = `[1:v]scale=${bubbleSize}:${bubbleSize},format=rgba,geq=lum='p(X,Y)':a='if(gt(pow(X-${bubbleSize}/2,2)+pow(Y-${bubbleSize}/2,2),pow(${bubbleSize}/2,2)),0,255)'[bubble];[0:v][bubble]overlay=${pos.x}:${pos.y}:shortest=1`;
    } else {
      // Square shape
      overlayFilter = `[1:v]scale=${bubbleSize}:${bubbleSize}[bubble];[0:v][bubble]overlay=${pos.x}:${pos.y}:shortest=1`;
    }

    await this.runFFmpeg([
      '-y',
      '-i', websiteVideoPath,
      '-i', introVideoPath,
      '-filter_complex', overlayFilter,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-pix_fmt', 'yuv420p',
      '-preset', 'fast',
      '-crf', '23',
      '-shortest',
      outputPath
    ]);

    return outputPath;
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
    await this.runFFmpeg([
      '-y',
      '-i', websiteVideoPath,
      '-i', introVideoPath,
      '-filter_complex', overlayFilter,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-pix_fmt', 'yuv420p',
      '-preset', 'fast',
      '-crf', '23',
      '-t', String(bubbleClipDuration),
      tempBubblePath
    ]);

    // If intro video is longer than bubble duration, concat with fullscreen portion
    if (introDuration > bubbleDuration) {
      const tempFullscreenPath = path.join(this.tempDir, `fullscreen_${uuidv4()}.mp4`);
      
      // Create fullscreen portion (skip first bubbleDuration seconds of intro)
      await this.runFFmpeg([
        '-y',
        '-ss', String(bubbleDuration),
        '-i', introVideoPath,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-pix_fmt', 'yuv420p',
        '-preset', 'fast',
        '-crf', '23',
        tempFullscreenPath
      ]);

      // Concatenate bubble and fullscreen
      const concatListPath = path.join(this.tempDir, `concat_${uuidv4()}.txt`);
      await fs.writeFile(concatListPath, `file '${tempBubblePath}'\nfile '${tempFullscreenPath}'`);

      await this.runFFmpeg([
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', concatListPath,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-pix_fmt', 'yuv420p',
        '-preset', 'fast',
        '-crf', '23',
        outputPath
      ]);

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
    const output = await this.runFFprobe([
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      videoPath
    ]);
    return parseFloat(output.trim());
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