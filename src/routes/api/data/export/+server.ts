import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exportAll } from '$lib/server/db';

// GET /api/data/export - Export all data as JSON
export const GET: RequestHandler = async () => {
    try {
        const data = exportAll();

        const exportData = {
            ...data,
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };

        return json({
            success: true,
            data: exportData
        });
    } catch (error) {
        console.error('Error exporting data:', error);
        return json({ success: false, error: 'Failed to export data' }, { status: 500 });
    }
};
