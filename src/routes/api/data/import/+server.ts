import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { importAll, backupDatabase } from '$lib/server/db';
import type { PromptWithDetails, Tag } from '$lib/types';

// POST /api/data/import - Import data from JSON (with auto backup)
export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();

        // Validate import data structure
        if (!body.prompts || !Array.isArray(body.prompts)) {
            return json({ success: false, error: 'Invalid data: prompts array required' }, { status: 400 });
        }

        if (!body.tags || !Array.isArray(body.tags)) {
            return json({ success: false, error: 'Invalid data: tags array required' }, { status: 400 });
        }

        // Auto backup before import
        let backupPath: string | null = null;
        try {
            backupPath = backupDatabase();
        } catch (backupError) {
            console.warn('Backup failed (database may not exist yet):', backupError);
        }

        // Perform import
        importAll({
            prompts: body.prompts as PromptWithDetails[],
            tags: body.tags as Tag[]
        });

        return json({
            success: true,
            data: {
                imported: {
                    prompts: body.prompts.length,
                    tags: body.tags.length
                },
                backupPath
            }
        });
    } catch (error) {
        console.error('Error importing data:', error);
        return json({ success: false, error: 'Failed to import data' }, { status: 500 });
    }
};
