import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllPrompts, createPrompt, getPromptsByCluster, getPromptsByTag } from '$lib/server/db';

// GET /api/prompts - List all prompts
export const GET: RequestHandler = async ({ url }) => {
    try {
        const groupBy = url.searchParams.get('groupBy');

        if (groupBy === 'cluster') {
            const groups = getPromptsByCluster();
            const result: Record<string, ReturnType<typeof getAllPrompts>> = {};
            groups.forEach((prompts, key) => {
                result[key] = prompts;
            });
            return json({ success: true, data: result });
        }

        if (groupBy === 'tag') {
            const groups = getPromptsByTag();
            const result: Record<string, ReturnType<typeof getAllPrompts>> = {};
            groups.forEach((prompts, key) => {
                result[key] = prompts;
            });
            return json({ success: true, data: result });
        }

        const prompts = getAllPrompts();
        return json({ success: true, data: prompts });
    } catch (error) {
        console.error('Error fetching prompts:', error);
        return json({ success: false, error: 'Failed to fetch prompts' }, { status: 500 });
    }
};

// POST /api/prompts - Create new prompt
export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();

        if (!body.title || typeof body.title !== 'string') {
            return json({ success: false, error: 'Title is required' }, { status: 400 });
        }

        const id = createPrompt({
            title: body.title,
            description: body.description,
            blocks: body.blocks,
            tagIds: body.tagIds
        });

        return json({ success: true, data: { id } }, { status: 201 });
    } catch (error) {
        console.error('Error creating prompt:', error);
        return json({ success: false, error: 'Failed to create prompt' }, { status: 500 });
    }
};
