import { useRef } from 'react';

const FileDropInput = ({ label, onFileChange, accept, value, error }) => {
  const fileInputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div
        className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg px-4 py-8 cursor-pointer bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-black dark:hover:border-white transition-all duration-200 ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
        }`}
        onClick={() => fileInputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {value ? (
          <span className="truncate text-sm text-black dark:text-white">{value.name || value}</span>
        ) : (
          <span className="text-sm">Drag & drop or click to select an image</span>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default FileDropInput;
