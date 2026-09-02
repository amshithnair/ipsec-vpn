import type { UploadResponse } from '../types';

// Simulated response from POST /api/v1/captures/upload
export const uploadResponseMock: UploadResponse = {
  id: 'cap-new',
  filename: 'uploaded-capture.pcap',
  status: 'uploaded',
};
