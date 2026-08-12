import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading Upstep Operations Hub...' }) => {
  return (
    <div className="page-loader-overlay">
      <div className="page-loader-card">
        <div className="page-loader-icon-box">
          <span className="page-loader-pawn">♟️</span>
          <Loader2 className="page-loader-spinner" />
        </div>
        <div className="page-loader-text">
          <h3>Upstep Operations Hub</h3>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
};
