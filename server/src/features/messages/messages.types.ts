export interface MessageRecord {
  id: string;
  task_id: string;
  sender_id: string;
  original_text: string;
  translated_text: string;
  created_at: string;
}

export interface SendMessageBody {
  original_text: string;
}
