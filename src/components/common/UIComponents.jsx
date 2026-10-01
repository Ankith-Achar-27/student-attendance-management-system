import React from 'react';

export const Badge = ({ variant = 'neutral', children }) => {
  return (
    <span className={`badge badge-${variant}`}>
      {children}
    </span>
  );
};

export const Card = ({ title, actions, children, style = {} }) => {
  return (
    <div className="card" style={style}>
      {title && (
        <div className="card-header">
          <div className="card-title">{title}</div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  icon = null,
  style = {},
}) => {
  const sizeClass = size === 'sm' ? 'btn-sm' : '';
  const variantClass = variant === 'secondary' ? 'btn-secondary' : 'btn-primary';

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

export const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export const AlertBanner = ({ type = 'info', message, onDismiss }) => {
  if (!message) return null;

  const typeClass = type === 'danger' ? 'alert-danger' : type === 'warning' ? 'alert-warning' : 'alert-info';
  const icon = type === 'danger' ? '⚠️' : type === 'warning' ? '⚠️' : 'ℹ️';

  return (
    <div className={`alert-box ${typeClass}`} style={{ justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{icon}</span>
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'inherit' }}
        >
          &times;
        </button>
      )}
    </div>
  );
};
