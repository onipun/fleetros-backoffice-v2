'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
    deletePackageImage,
    getImageUrl,
    getPackageImage,
    updatePackageImageMetadata,
    uploadPackageImage,
    validateImageFile,
} from '@/lib/api/package-image-api';
import type { PackageImage } from '@/types';
import { AlertCircle, Check, Image as ImageIcon, Loader2, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface PackageBannerUploadProps {
  packageId?: number;
  onImageChange?: (image: PackageImage | null) => void;
  className?: string;
}

export function PackageBannerUpload({ packageId, onImageChange, className }: PackageBannerUploadProps) {
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentImage, setCurrentImage] = useState<PackageImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Metadata editing
  const [editingMetadata, setEditingMetadata] = useState(false);
  const [description, setDescription] = useState('');
  const [altText, setAltText] = useState('');

  // Load existing image when packageId is available
  useEffect(() => {
    if (packageId) {
      loadBannerImage();
    }
  }, [packageId]);

  const loadBannerImage = async () => {
    if (!packageId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const image = await getPackageImage(packageId);
      setCurrentImage(image);
      if (image) {
        setDescription(image.description || '');
        setAltText(image.altText || '');
      }
      onImageChange?.(image);
    } catch (err) {
      console.error('Failed to load banner image:', err);
      setCurrentImage(null);
      onImageChange?.(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      toast({
        title: t('package.banner.error'),
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!packageId) {
      setError(t('package.banner.savePackageFirst'));
      toast({
        title: t('package.banner.error'),
        description: t('package.banner.savePackageFirst'),
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const result = await uploadPackageImage(
        packageId,
        selectedFile,
        description || undefined,
        altText || undefined
      );

      setCurrentImage(result.image);
      setPreviewUrl(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      onImageChange?.(result.image);

      toast({
        title: t('common.success'),
        description: result.replaced 
          ? t('package.banner.replacedSuccess')
          : t('package.banner.uploadSuccess'),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('package.banner.uploadFailed');
      setError(errorMessage);
      toast({
        title: t('package.banner.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!packageId || !currentImage) return;

    if (!confirm(t('package.banner.deleteConfirm'))) return;

    try {
      await deletePackageImage(packageId);
      setCurrentImage(null);
      setDescription('');
      setAltText('');
      onImageChange?.(null);

      toast({
        title: t('common.success'),
        description: t('package.banner.deleteSuccess'),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('package.banner.deleteFailed');
      toast({
        title: t('package.banner.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateMetadata = async () => {
    if (!packageId || !currentImage) return;

    try {
      const updatedImage = await updatePackageImageMetadata(packageId, description, altText);
      setCurrentImage(updatedImage);
      setEditingMetadata(false);
      onImageChange?.(updatedImage);

      toast({
        title: t('common.success'),
        description: t('package.banner.metadataUpdated'),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('package.banner.updateFailed');
      toast({
        title: t('package.banner.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleCancelSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          <CardTitle>{t('package.banner.title')}</CardTitle>
        </div>
        <CardDescription>{t('package.banner.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {currentImage && !previewUrl ? (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border aspect-[3/1] bg-muted">
              <img
                src={getImageUrl(currentImage.imageUrl)}
                alt={currentImage.altText || t('package.banner.altTextDefault')}
                className="w-full h-full object-cover"
              />
            </div>

            {editingMetadata ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="description">{t('package.banner.descriptionLabel')}</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('package.banner.descriptionPlaceholder')}
                    rows={2}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {description.length}/500 {t('common.characters')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="altText">{t('package.banner.altTextLabel')}</Label>
                  <Input
                    id="altText"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder={t('package.banner.altTextPlaceholder')}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    {altText.length}/100 {t('common.characters')}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleUpdateMetadata} size="sm" type="button">
                    <Check className="h-4 w-4 mr-2" />
                    {t('common.save')}
                  </Button>
                  <Button 
                    onClick={() => {
                      setEditingMetadata(false);
                      setDescription(currentImage.description || '');
                      setAltText(currentImage.altText || '');
                    }} 
                    variant="outline" 
                    size="sm"
                    type="button"
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">
                    <strong>{t('package.banner.descriptionLabel')}:</strong>{' '}
                    {currentImage.description || t('common.notAvailable')}
                  </p>
                  <p className="text-muted-foreground">
                    <strong>{t('package.banner.altTextLabel')}:</strong>{' '}
                    {currentImage.altText || t('common.notAvailable')}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t('package.banner.uploadedAt')}: {new Date(currentImage.uploadedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setEditingMetadata(true)}
                    variant="outline"
                    size="sm"
                    type="button"
                  >
                    {t('package.banner.editMetadata')}
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    type="button"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {t('package.banner.replace')}
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : previewUrl ? (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border aspect-[3/1] bg-muted">
              <img
                src={previewUrl}
                alt={t('package.banner.preview')}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-description">{t('package.banner.descriptionLabel')}</Label>
                <Textarea
                  id="new-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('package.banner.descriptionPlaceholder')}
                  rows={2}
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-altText">{t('package.banner.altTextLabel')}</Label>
                <Input
                  id="new-altText"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder={t('package.banner.altTextPlaceholder')}
                  maxLength={100}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleUpload} disabled={uploading || !packageId} type="button">
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('package.banner.uploading')}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {currentImage ? t('package.banner.replace') : t('package.banner.upload')}
                    </>
                  )}
                </Button>
                <Button onClick={handleCancelSelection} variant="outline" type="button">
                  <X className="h-4 w-4 mr-2" />
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 text-center hover:border-muted-foreground/50 transition-colors">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-2">{t('package.banner.noImage')}</p>
              <p className="text-xs text-muted-foreground mb-4">
                {t('package.banner.supportedFormats')}
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={!packageId}
                type="button"
              >
                <Upload className="h-4 w-4 mr-2" />
                {t('package.banner.selectFile')}
              </Button>
              {!packageId && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  {t('package.banner.savePackageFirst')}
                </p>
              )}
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
