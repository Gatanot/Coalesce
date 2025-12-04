import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPromptById, updatePrompt, deletePrompt } from '$lib/server/db';

// GET /api/prompts/[id] - Get single prompt with details
export const GET: RequestHandler = async ({ params }) => {
    try {
        const prompt = getPromptById(params.id);

        if (!prompt) {
            return json({ success: false, error: 'Prompt not found' }, { status: 404 });
        }

        return json({ success: true, data: prompt });
    } catch (error) {
        console.error('Error fetching prompt:', error);
        return json({ success: false, error: 'Failed to fetch prompt' }, { status: 500 });
    }
};

// PUT /api/prompts/[id] - Update prompt
export const PUT: RequestHandler = async ({ params, request }) => {
    try {
        const body = await request.json();

        const success = updatePrompt(params.id, {
            title: body.title,
            description: body.description,
            blocks: body.blocks,
            tagIds: body.tagIds
        });

        if (!success) {
            return json({ success: false, error: 'Prompt not found' }, { status: 404 });
        }

        return json({ success: true });
    } catch (error) {
        console.error('Error updating prompt:', error);
        return json({ success: false, error: 'Failed to update prompt' }, { status: 500 });
    }
};

// DELETE /api/prompts/[id] - Delete prompt
export const DELETE: RequestHandler = async ({ params }) => {
    try {
        const success = deletePrompt(params.id);

        if (!success) {
            return json({ success: false, error: 'Prompt not found' }, { status: 404 });
        }

        return json({ success: true });
    } catch (error) {
        console.error('Error deleting prompt:', error);
        return json({ success: false, error: 'Failed to delete prompt' }, { status: 500 });
    }
};
