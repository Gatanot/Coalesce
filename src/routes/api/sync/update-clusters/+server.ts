import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateClusters } from '$lib/server/db';
import { env } from '$env/dynamic/private';
import type { ClusterUpdateItem } from '$lib/types';

// POST /api/sync/update-clusters - Update cluster assignments (requires API key)
export const POST: RequestHandler = async ({ request }) => {
    // Verify API key
    const apiKey = request.headers.get('X-API-Key');
    const expectedKey = env.API_SECRET_KEY || 'default-dev-key';

    if (apiKey !== expectedKey) {
        return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Validate input
        if (!Array.isArray(body)) {
            return json({
                success: false,
                error: 'Invalid data: expected array of { id, cluster_group, cluster_keywords? }'
            }, { status: 400 });
        }

        // Validate each item
        for (const item of body) {
            if (!item.id || typeof item.id !== 'string') {
                return json({ success: false, error: 'Each item must have a valid id' }, { status: 400 });
            }
            if (!item.cluster_group || typeof item.cluster_group !== 'string') {
                return json({ success: false, error: 'Each item must have a valid cluster_group' }, { status: 400 });
            }
        }

        updateClusters(body as ClusterUpdateItem[]);

        return json({
            success: true,
            data: {
                updated: body.length
            }
        });
    } catch (error) {
        console.error('Error updating clusters:', error);
        return json({ success: false, error: 'Failed to update clusters' }, { status: 500 });
    }
};
