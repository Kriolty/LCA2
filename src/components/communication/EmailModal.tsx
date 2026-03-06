import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Send, Paperclip } from 'lucide-react';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: {
    id: string;
    email: string;
    name: string;
  };
  onSent?: () => void;
}

export const EmailModal = ({ isOpen, onClose, recipient, onSent }: EmailModalProps) => {
  const { user } = useAuthStore();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!user || !subject.trim() || !body.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('communication_logs')
        .insert({
          type: 'email',
          channel: 'email',
          from_address: user.email,
          to_address: recipient.email,
          subject,
          body,
          html_body: body.replace(/\n/g, '<br>'),
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
        description: `Sent email to ${recipient.name}`,
        metadata: { subject, recipient: recipient.email },
      });

      setSubject('');
      setBody('');
      onSent?.();
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Email" size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To
          </label>
          <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
            <span className="text-gray-900">{recipient.name}</span>
            <span className="text-gray-500 ml-2">({recipient.email})</span>
          </div>
        </div>

        <Input
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter email subject..."
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your message here..."
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            This email will be logged in the communication history for this lead.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            loading={sending}
            disabled={!subject.trim() || !body.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            Send Email
          </Button>
        </div>
      </div>
    </Modal>
  );
};
