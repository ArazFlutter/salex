import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { motion } from 'motion/react';
import { ChevronLeft, Loader2, Plus, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { uploadListingImage, ApiError } from '@/lib/api';
import Image from 'next/image';

interface ImageUploadScreenProps {
  onNavigate: (screen: string) => void;
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export const ImageUploadScreen = ({ onNavigate, images, onImagesChange }: ImageUploadScreenProps) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const openGallery = () => {
    if (images.length >= 6 || uploading) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (!files?.length) {
      return;
    }

    setUploadError('');
    setUploading(true);
    const next = [...images];
    try {
      for (const file of Array.from(files)) {
        if (next.length >= 6) {
          break;
        }
        const { url } = await uploadListingImage(file);
        next.push(url);
        onImagesChange([...next]);
      }
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    onImagesChange(images.filter((_, imageIndex) => imageIndex !== index));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-5 pb-6 h-screen flex flex-col bg-white">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => onNavigate('createListing')}
          className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-white border border-[#E5E7EB] shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB] transition-colors"
        >
          <ChevronLeft size={24} className="text-[#111827]" />
        </button>
        <h1 className="text-[24px] font-semibold text-[#111827]">{t('upload_images')}</h1>
      </div>

      <div className="flex-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-[#6B7280] text-[14px] mb-6">{t('add_images_desc')}</p>

        {uploadError ? <p className="text-[13px] text-red-500 mb-4">{uploadError}</p> : null}

        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const image = images[index];

            return (
              <div
                key={index}
                onClick={!image && !uploading ? openGallery : undefined}
                className={`aspect-square rounded-[14px] overflow-hidden relative flex flex-col items-center justify-center transition-all ${
                  image
                    ? 'bg-[#F7F8FC] border-2 border-transparent'
                    : `border-2 border-dashed border-[#E5E7EB] ${uploading ? 'opacity-60 cursor-wait' : 'hover:border-[#5B5CFF] hover:bg-[#EEF0FF] cursor-pointer'}`
                }`}
              >
                {image ? (
                  <>
                    <Image src={image} alt={`Listing ${index + 1}`} fill className="object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemoveImage(index);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-red-500 flex items-center justify-center shadow-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : uploading ? (
                  <Loader2 size={24} className="text-[#5B5CFF] animate-spin" />
                ) : (
                  <Plus size={24} className="text-[#6B7280]" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-[#EEF0FF] rounded-[14px] border border-[#5B5CFF]/20">
          <p className="text-[14px] text-[#5B5CFF] font-medium text-center">
            {images.length < 3 ? t('add_more_images').replace('{count}', String(3 - images.length)) : t('ready_to_publish')}
          </p>
        </div>

        {images.length === 0 && (
          <div className="mt-6 flex items-center justify-center gap-2 text-[#6B7280] text-[14px]">
            <ImageIcon size={16} />
            <span>{t('add_photos')}</span>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-[#E5E7EB]">
        <Button
          onClick={() => onNavigate('sharePlan')}
          className="w-full max-w-[382px] mx-auto"
          disabled={images.length < 3 || uploading}
        >
          {t('continue')}
        </Button>
      </div>
    </motion.div>
  );
};
