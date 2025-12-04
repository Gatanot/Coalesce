import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllTags, createTag, deleteTag } from '$lib/server/db';

// GET /api/tags - List all tags
export const GET: RequestHandler = async () => {
    try {
        const tags = getAllTags();
        return json({ success: true, data: tags });
    } catch (error) {
        console.error('Error fetching tags:', error);
        return json({ success: false, error: 'Failed to fetch tags' }, { status: 500 });
    }
};

// POST /api/tags - Create new tag
export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();

        if (!body.name || typeof body.name !== 'string') {
            return json({ success: false, error: 'Tag name is required' }, { status: 400 });
        }

        const id = createTag(body.name.trim());
        return json({ success: true, data: { id } }, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating tag:', error);
        // Handle unique constraint violation
        if (error instanceof Error && error.message.includes('UNIQUE')) {
            return json({ success: false, error: 'Tag already exists' }, { status: 409 });
        }
        return json({ success: false, error: 'Failed to create tag' }, { status: 500 });
    }
};

// DELETE /api/tags - Delete tag
export const DELETE: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();

        if (!body.id || typeof body.id !== 'number') {
            return json({ success: false, error: 'Tag ID is required' }, { status: 400 });
        }

        const success = deleteTag(body.id);

        if (!success) {
            return json({ success: false, error: 'Tag not found' }, { status: 404 });
        }

        return json({ success: true });
    } catch (error) {
        console.error('Error deleting tag:', error);
        return json({ success: false, error: 'Failed to delete tag' }, { status: 500 });
    }
};
