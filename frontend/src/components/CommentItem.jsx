import { useAuth } from '../context/AuthContext';
import { fileUrl } from '../api/client';

export default function CommentItem({ comment, onDelete }) {
  const { user } = useAuth();
  const canDelete = user && (user.roleUser === 'admin' || user.username === comment.usernameComment);

  return (
    <li className="comment-item">
      {comment.commenterImageUser && (
        <img className="avatar-sm" src={fileUrl(comment.commenterImageUser)} alt="" />
      )}
      <div className="comment-body">
        <div className="comment-header">
          <strong>
            {comment.commenterNameUser} {comment.commenterLastnameUser}
          </strong>
          <span className="comment-date">{new Date(comment.createdIn).toLocaleString()}</span>
        </div>
        <p>{comment.bodyComment}</p>
        {canDelete && (
          <button type="button" className="link-button danger" onClick={() => onDelete(comment.idComment)}>
            Eliminar
          </button>
        )}
      </div>
    </li>
  );
}
