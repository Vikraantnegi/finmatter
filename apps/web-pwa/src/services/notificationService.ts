'use client';

import toast from 'react-hot-toast';

export class NotificationService {
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      // eslint-disable-next-line no-console
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  static showNotification(title: string, options?: any) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    } else {
      // Fallback to toast notification
      toast.success(title);
    }
  }

  static notifyStatementParsed(cardName: string) {
    this.showNotification('Statement Parsed Successfully!', {
      body: `Your ${cardName} statement has been processed and is ready to view.`,
      tag: 'statement-parsed',
    });
  }

  static notifyStatementFailed(cardName: string, error?: string) {
    this.showNotification('Statement Parsing Failed', {
      body: `Failed to process your ${cardName} statement. ${error ? error : 'Please try uploading again.'}`,
      tag: 'statement-failed',
    });
  }

  static notifyUploadComplete(cardName: string) {
    this.showNotification('Statement Uploaded', {
      body: `Your ${cardName} statement has been uploaded and is being processed.`,
      tag: 'statement-uploaded',
    });
  }
}
