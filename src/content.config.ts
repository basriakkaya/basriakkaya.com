import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
  }).superRefine((data, context) => {
    if (data.cover && !data.coverAlt) context.addIssue({ code: 'custom', path: ['coverAlt'], message: 'cover kullanıldığında coverAlt zorunludur.' });
    if (data.updatedAt && data.updatedAt < data.publishedAt) context.addIssue({ code: 'custom', path: ['updatedAt'], message: 'updatedAt, publishedAt tarihinden önce olamaz.' });
  }),
});

export const collections = { blog };
