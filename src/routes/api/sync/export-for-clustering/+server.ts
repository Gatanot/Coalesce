import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPromptsForClustering } from '$lib/server/db';
import { env } from '$env/dynamic/private';

// GET /api/sync/export-for-clustering - Export data for AI clustering (requires API key)
export const GET: RequestHandler = async ({ request }) => {
    // Verify API key
    const apiKey = request.headers.get('X-API-Key');
    const expectedKey = env.API_SECRET_KEY || 'default-dev-key';

    if (apiKey !== expectedKey) {
        return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = getPromptsForClustering();

        return json({
            success: true,
            data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error exporting for clustering:', error);
        return json({ success: false, error: 'Failed to export data' }, { status: 500 });
    }
};
