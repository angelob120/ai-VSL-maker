const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');
const fs = require('fs').promises;

class CSVService {
  /**
   * Parse CSV file and return array of lead objects
   */
  async parseLeadsCSV(filePath) {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    return new Promise((resolve, reject) => {
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, records) => {
        if (err) reject(err);
        else {
          // Map CSV columns to lead fields
          const leads = records.map(record => {
            // Try to find common column names
            const websiteUrl = record.website_url || record.Website || record.website || 
                             record.URL || record.url || record['Website Url'] || 
                             record['Website URL'] || record.site || '';
            
            const firstName = record.first_name || record.FirstName || record['First Name'] ||
                            record.firstname || record.First || record.Name || '';
            
            const lastNameOrCompany = record.last_name_or_company || record.company || 
                                     record.Company || record.LastName || record['Last Name'] ||
                                     record['Company Name'] || record.lastname || 
                                     record.business || record.Business || '';
            
            const phone = record.phone || record.Phone || record.tel || record.Tel ||
                         record['Phone Number'] || record.mobile || record.Mobile || '';
            
            const email = record.email || record.Email || record.EMAIL || 
                         record['Email Address'] || '';

            // Collect any additional fields as custom_fields
            const knownFields = ['website_url', 'Website', 'website', 'URL', 'url', 
                               'Website Url', 'Website URL', 'site', 'first_name', 
                               'FirstName', 'First Name', 'firstname', 'First', 'Name',
                               'last_name_or_company', 'company', 'Company', 'LastName',
                               'Last Name', 'Company Name', 'lastname', 'business', 'Business',
                               'phone', 'Phone', 'tel', 'Tel', 'Phone Number', 'mobile', 'Mobile',
                               'email', 'Email', 'EMAIL', 'Email Address'];
            
            const customFields = {};
            Object.entries(record).forEach(([key, value]) => {
              if (!knownFields.includes(key) && value) {
                customFields[key] = value;
              }
            });

            return {
              website_url: websiteUrl,
              first_name: firstName,
              last_name_or_company: lastNameOrCompany,
              phone: phone,
              email: email,
              custom_fields: customFields,
              isValid: !!websiteUrl // Lead is valid if it has a website URL
            };
          });

          resolve(leads);
        }
      });
    });
  }

  /**
   * Validate leads array
   */
  validateLeads(leads) {
    const valid = [];
    const invalid = [];

    leads.forEach((lead, index) => {
      if (lead.isValid && this.isValidUrl(lead.website_url)) {
        valid.push({ ...lead, originalIndex: index + 1 });
      } else {
        invalid.push({ ...lead, originalIndex: index + 1, reason: 'Invalid or missing website URL' });
      }
    });

    return { valid, invalid };
  }

  /**
   * Check if URL is valid
   */
  isValidUrl(string) {
    try {
      // Add protocol if missing
      let url = string;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Normalize URL (add https:// if missing)
   */
  normalizeUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    return url;
  }

  /**
   * Generate CSV with video links
   */
  async generateOutputCSV(data) {
    const records = data.map(item => ({
      'Website URL': item.website_url,
      'First Name': item.first_name || '',
      'Company/Last Name': item.last_name_or_company || '',
      'Phone': item.phone || '',
      'Email': item.email || '',
      'Landing Page URL': item.landing_page_url || '',
      'Video URL': item.video_url || '',
      'Status': item.status || 'pending'
    }));

    return new Promise((resolve, reject) => {
      stringify(records, {
        header: true
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });
  }
}

module.exports = new CSVService();
