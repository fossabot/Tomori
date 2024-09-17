import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { apiClient } from "@/apiClient";
import type { PostModel, NoteModel, CategoryModel } from "@mx-space/api-client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function postslist(): Promise<BlogItem[]> {
  const [postsList, notesList] = await Promise.all([
    apiClient.post.getList(),
    apiClient.note.getList()
  ]);

  const allBlogPosts: PostModel[] = postsList.data;
  const allBlogNotes: NoteModel[] = notesList.data;

  const transformedNotes: BlogItem[] = await Promise.all(allBlogNotes.map(async note => {
    const summary = await apiClient.ai.getSummary({ articleId: note.id, lang: 'zh' });
    return {
      id: note.id,
      category: { name: 'Notes', slug: 'Notes' } as CategoryModel,
      created: note.created,
      modified: note.modified,
      title: note.title,
      text: note.text,
      url: `/notes/${note.nid}`,
      summary: summary.summary,
      cover: note.images && note.images[0] ? note.images[0].src : '',
      tags: note.weather && note.mood ? [`${note.weather} - ${note.mood}`] : null,
    };
  }));

  const transformedPosts: BlogItem[] = allBlogPosts.map(post => ({
    id: post.id,
    category: post.category,
    created: post.created,
    modified: post.modified,
    title: post.title,
    tags: post.tags,
    text: post.text,
    url: `/posts/${post.category.slug}/${post.slug}`,
    summary: post.summary,
    cover: post.images && post.images[0] ? post.images[0].src : '',
  }));

  return [...transformedPosts, ...transformedNotes].sort((a, b) => {
    return new Date(b.created).getTime() - new Date(a.created).getTime();
  });
}

export interface BlogItem {
  id: string;
  category: CategoryModel;
  created: string;
  modified: string | null;
  title: string;
  text: string;
  url: string;
  summary: string | null | undefined;
  cover: string;
  tags: string[] | null;
}