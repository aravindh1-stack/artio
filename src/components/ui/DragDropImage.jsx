import React from 'react';
import { useDropzone } from 'react-dropzone';

const DragDropImage = ({ onDrop, files, previewUrls, uploading }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });
  return (
    <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'}`}> 
      <input {...getInputProps()} />
      <p className="text-gray-600 dark:text-gray-400">Drag & drop images here, or click to select files</p>
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        {previewUrls.map((url, i) => (
          <img key={i} src={url} alt="preview" className="w-20 h-20 object-cover rounded-lg shadow" />
        ))}
      </div>
      {uploading && <p className="mt-2 text-primary">Uploading...</p>}
    </div>
  );
};

export default DragDropImage;
