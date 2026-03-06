import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { MessageSquare, Send } from 'lucide-react';

interface SMSModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: {
    id: string;
    phone: string;
    name: string;
  };
  onSent?: () => void;
}

export const SMSModal = ({ isOpen, onClose, recipient, onSent }: SMSModalProps) => {
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const characterCount = message.length;
  const smsCount = Math.ceil(characterCount / 160) || 1;

  const handleSend = async () => {
    if (!user || !message.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('communication_logs')
        .insert({
          type: 'sms',
          channel: 'sms',
          from_address: user.email,
          to_address: recipient.phone,
          body: message,
          lead_id: recipient.id,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'create',
        entity_type: 'communication',
        entity_id: recipient.id,
        description: `Sent SMS to ${recipient.name}`,
        metadata: { phone: recipient.phone, length: characterCount },
      });

      setMessage('');
      onSent?.();
      onClose();
    } catch (error) {
      console.error('Error sending SMS:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send SMS" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To
          </label>
          <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
            <span className="text-gray-900">{recipient.name}</span>
            <span className="text-gray-500 ml-2">({recipient.phone})</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your SMS message..."
            rows={6}
            maxLength={1000}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-500">
              {characterCount} / 1000 characters
            </p>
            <p className="text-sm text-gray-500">
              {smsCount} SMS {smsCount > 1 ? 'messages' : 'message'}
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            SMS will be sent via your configured provider. Standard rates apply.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            loading={sending}
            disabled={!message.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            Send SMS
          </Button>
        </div>
      </div>
    </Modal>
  );
};
