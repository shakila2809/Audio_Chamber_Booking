const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');

class MicrosoftGraphService {
  constructor(accessToken) {
    this.client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  async createCalendarEvent(eventData) {
    try {
      const event = await this.client.api('/me/calendar/events').post(eventData);
      return event;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  async deleteCalendarEvent(eventId) {
    try {
      await this.client.api(`/me/calendar/events/${eventId}`).delete();
      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  async sendEmail(to, subject, body) {
    try {
      const message = {
        message: {
          subject,
          body: { contentType: 'HTML', content: body },
          toRecipients: Array.isArray(to) 
            ? to.map(email => ({ emailAddress: { address: email } }))
            : [{ emailAddress: { address: to } }],
        },
        saveToSentItems: true,
      };
      await this.client.api('/me/sendMail').post(message);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}

module.exports = MicrosoftGraphService;