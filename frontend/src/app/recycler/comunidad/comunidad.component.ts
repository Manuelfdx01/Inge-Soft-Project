import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  CommunityService,
  CommunityPost,
  COMMUNITY_TAGS
} from '../../core/services/community.service';
import { AuthService, User } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-comunidad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comunidad.component.html',
  styleUrl: './comunidad.component.scss'
})
export class ComunidadComponent implements OnInit {

  currentUser: User | null = null;

  posts: CommunityPost[] = [];
  loading = false;
  error = '';

  /* ── filtros ── */
  readonly tags = COMMUNITY_TAGS;
  activeTag = 'Todos';

  /* ── nueva publicación ── */
  showForm = false;
  newContent = '';
  selectedTags: string[] = [];
  submitting = false;
  submitError = '';

  /* ── comentarios ── */
  commentInputs: Record<number, string> = {};
  expandedComments: Set<number> = new Set();
  submittingComment: number | null = null;

  constructor(
    private community: CommunityService,
    private auth: AuthService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getUser();
    this.loadPosts();
  }

  /* ─── POSTS ─── */

  loadPosts(): void {
    this.loading = true;
    this.error = '';
    this.community.getPosts(this.activeTag === 'Todos' ? undefined : this.activeTag).subscribe({
      next: (data) => { this.posts = data; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.error = 'No se pudieron cargar las publicaciones.'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  setFilter(tag: string): void {
    this.activeTag = tag;
    this.loadPosts();
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) { this.newContent = ''; this.selectedTags = []; this.submitError = ''; }
  }

  toggleTag(tag: string): void {
    const idx = this.selectedTags.indexOf(tag);
    if (idx >= 0) {
      this.selectedTags.splice(idx, 1);
    } else {
      this.selectedTags.push(tag);
    }
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  submitPost(): void {
    if (!this.newContent.trim()) { this.submitError = 'Escribe algo antes de publicar.'; return; }
    this.submitting = true;
    this.submitError = '';
    this.community.createPost(this.newContent.trim(), this.selectedTags).subscribe({
      next: (post) => {
        this.posts.unshift(post);
        this.newContent = '';
        this.selectedTags = [];
        this.showForm = false;
        this.submitting = false;
        this.toast.success('¡Publicación creada con éxito!');
        this.cdr.markForCheck();
      },
      error: () => {
        this.submitError = 'Error al publicar. Inténtalo de nuevo.';
        this.submitting = false;
        this.toast.error('Error al publicar. Inténtalo de nuevo.');
        this.cdr.markForCheck();
      }
    });
  }

  deletePost(post: CommunityPost): void {
    if (!confirm('¿Eliminar esta publicación?')) return;
    this.community.deletePost(post.id).subscribe({
      next: () => {
        this.posts = this.posts.filter(p => p.id !== post.id);
        this.toast.success('Publicación eliminada.');
        this.cdr.markForCheck();
      },
      error: () => this.toast.error('No se pudo eliminar la publicación.')
    });
  }

  /* ─── COMENTARIOS ─── */

  toggleComments(postId: number): void {
    if (this.expandedComments.has(postId)) {
      this.expandedComments.delete(postId);
    } else {
      this.expandedComments.add(postId);
    }
  }

  isCommentsOpen(postId: number): boolean {
    return this.expandedComments.has(postId);
  }

  submitComment(post: CommunityPost): void {
    const content = (this.commentInputs[post.id] || '').trim();
    if (!content) return;
    this.submittingComment = post.id;
    this.community.addComment(post.id, content).subscribe({
      next: (comment) => {
        post.comments.push(comment);
        post.comment_count++;
        this.commentInputs[post.id] = '';
        this.submittingComment = null;
        this.toast.success('Comentario enviado.');
        this.cdr.markForCheck();
      },
      error: () => {
        this.submittingComment = null;
        this.toast.error('Error al enviar el comentario.');
        this.cdr.markForCheck();
      }
    });
  }

  /* ─── UTILS ─── */

  levelIcon(level: number): string {
    return ['🌱', '🌿', '🌳', '⭐', '👑', '💎'][level - 1] ?? '🌱';
  }

  timeAgo(date: string): string {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'Hace unos segundos';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} días`;
  }

  isOwner(post: CommunityPost): boolean {
    return this.currentUser?.username === post.username;
  }
}
