// Simple ES module script to send a test GA4 event using MeasurementProtocolClient
import 'dotenv/config';
import { MeasurementProtocolClient } from './build/measurement-protocol-client.js';

const measurementId = process.env.GA_MEASUREMENT_ID;
const apiSecret = process.env.GA_API_SECRET;
if (!measurementId || !apiSecret) {
    console.error('Missing GA_MEASUREMENT_ID or GA_API_SECRET in .env');
    process.exit(1);
}

const client = new MeasurementProtocolClient(measurementId, apiSecret);

const testEvent = {
    client_id: 'test_client_' + Date.now(),
    events: [{ name: 'test_event', params: { test_param: 'value' } }]
};

client.sendEvent(testEvent)
    .then(res => console.log('Event sent successfully:', JSON.stringify(res, null, 2)))
    .catch(err => console.error('Error sending event:', err));
