import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string().trim().min(1)).max(8),
    category: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    series: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    seriesOrder: z.number().int().positive().optional(),
    toc: z.boolean().default(true),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
  }).superRefine((data, context) => {
    if (data.cover && !data.coverAlt) context.addIssue({ code: 'custom', path: ['coverAlt'], message: 'cover kullanıldığında coverAlt zorunludur.' });
    if (data.updatedAt && data.updatedAt < data.publishedAt) context.addIssue({ code: 'custom', path: ['updatedAt'], message: 'updatedAt, publishedAt tarihinden önce olamaz.' });
    if (data.series && !data.seriesOrder) context.addIssue({ code: 'custom', path: ['seriesOrder'], message: 'series kullanıldığında seriesOrder zorunludur.' });
    if (data.seriesOrder && !data.series) context.addIssue({ code: 'custom', path: ['series'], message: 'seriesOrder kullanıldığında series zorunludur.' });
    if (new Set(data.tags.map((tag) => tag.toLocaleLowerCase('tr-TR'))).size !== data.tags.length) context.addIssue({ code: 'custom', path: ['tags'], message: 'Aynı etiket bir yazıda birden fazla kullanılamaz.' });
  }),
});

export const collections = { blog };
