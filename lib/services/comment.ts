interface Comment {
  id: string
  postId: string
  userId: string
  username: string
  text: string
  createdAt: string
  likeCount: number
}

class CommentService {
  private comments: Comment[] = []

  constructor() {
    this.loadComments()
  }

  private loadComments() {
    const saved = localStorage.getItem('sparkd_comments')
    if (saved) {
      this.comments = JSON.parse(saved)
    }
  }

  private saveComments() {
    localStorage.setItem('sparkd_comments', JSON.stringify(this.comments))
  }

  addComment(postId: string, userId: string, username: string, text: string): Comment {
    const comment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      postId,
      userId,
      username,
      text,
      createdAt: new Date().toISOString(),
      likeCount: 0,
    }
    this.comments.push(comment)
    this.saveComments()
    return comment
  }

  getComments(postId: string): Comment[] {
    return this.comments.filter(c => c.postId === postId)
  }

  deleteComment(commentId: string) {
    this.comments = this.comments.filter(c => c.id !== commentId)
    this.saveComments()
  }
}

export const commentService = new CommentService()
