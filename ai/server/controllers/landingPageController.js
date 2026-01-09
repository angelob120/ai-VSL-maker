const { GeneratedVideo } = require('../models');

class LandingPageController {
  /**
   * Get landing page data by slug
   */
  async getLandingPage(req, res) {
    try {
      const { slug } = req.params;
      const video = await GeneratedVideo.findBySlug(slug);
      
      if (!video) {
        return res.status(404).json({ success: false, error: 'Landing page not found' });
      }

      // Return all data needed to render the landing page
      res.json({ 
        success: true, 
        data: {
          id: video.id,
          websiteUrl: video.website_url,
          firstName: video.first_name,
          lastNameOrCompany: video.last_name_or_company,
          phone: video.phone,
          email: video.email,
          videoUrl: video.video_url,
          introVideoUrl: video.intro_video_url,
          status: video.status,
          settings: {
            videoTitle: video.video_title,
            buttonText: video.button_text,
            buttonLink: video.button_link,
            accentColor: video.accent_color,
            textColor: video.text_color,
            backgroundColor: video.background_color,
            darkMode: video.dark_mode,
            displayMode: video.display_mode,
            position: video.position,
            shape: video.shape
          }
        }
      });
    } catch (error) {
      console.error('Error fetching landing page:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get video generation status
   */
  async getVideoStatus(req, res) {
    try {
      const { id } = req.params;
      const video = await GeneratedVideo.findById(id);
      
      if (!video) {
        return res.status(404).json({ success: false, error: 'Video not found' });
      }

      res.json({ 
        success: true, 
        data: {
          id: video.id,
          status: video.status,
          videoUrl: video.video_url,
          errorMessage: video.error_message
        }
      });
    } catch (error) {
      console.error('Error fetching video status:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new LandingPageController();
