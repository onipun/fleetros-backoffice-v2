'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    useCreateCustomCategory,
    useCustomCategories,
    useDeleteCustomCategory,
    useUpdateCustomCategory,
} from '@/hooks/use-booking-images';
import { toast } from '@/hooks/use-toast';
import type { CustomImageCategory } from '@/types';
import {
    Box,
    Car,
    Circle,
    Edit,
    Gauge,
    Plus,
    Settings,
    Tag,
    Trash2,
    Wind,
    Wrench,
    Zap
} from 'lucide-react';
import { useState } from 'react';

const PRESET_COLORS = [
  '#FF5722', // Deep Orange
  '#F44336', // Red
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#673AB7', // Deep Purple
  '#3F51B5', // Indigo
  '#2196F3', // Blue
  '#03A9F4', // Light Blue
  '#00BCD4', // Cyan
  '#009688', // Teal
  '#4CAF50', // Green
  '#8BC34A', // Light Green
  '#CDDC39', // Lime
  '#FFC107', // Amber
  '#FF9800', // Orange
  '#795548', // Brown
  '#607D8B', // Blue Grey
];

const PRESET_ICONS = [
  'interior',
  'exterior',
  'tire',
  'fuel',
  'speedometer',
  'windshield',
  'engine',
  'damage',
  'seat',
  'trunk',
];

// Icon mapping for display
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  interior: Box,
  exterior: Car,
  tire: Circle,
  fuel: Zap,
  speedometer: Gauge,
  windshield: Wind,
  engine: Settings,
  damage: Wrench,
  seat: Box,
  trunk: Box,
};

// Helper to get icon component
const getIconComponent = (iconName: string) => {
  return ICON_MAP[iconName] || Tag;
};

interface CustomCategoryManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomCategoryManagement({ open, onOpenChange }: CustomCategoryManagementProps) {
  const { t } = useLocale();
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedCategory, setSelectedCategory] = useState<CustomImageCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    displayColor: PRESET_COLORS[0],
    icon: PRESET_ICONS[0],
  });

  const { data: categoriesData, isLoading } = useCustomCategories();
  const createMutation = useCreateCustomCategory();
  const updateMutation = useUpdateCustomCategory();
  const deleteMutation = useDeleteCustomCategory();

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      displayColor: PRESET_COLORS[0],
      icon: PRESET_ICONS[0],
    });
    setSelectedCategory(null);
    setMode('list');
  };

  const handleCreate = () => {
    console.log('handleCreate called'); // Debug log
    console.log('Current mode before:', mode); // Debug log
    setFormData({
      name: '',
      description: '',
      displayColor: PRESET_COLORS[0],
      icon: PRESET_ICONS[0],
    });
    setSelectedCategory(null);
    setMode('create');
    console.log('Mode set to create'); // Debug log
  };

  const handleEdit = (category: CustomImageCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      displayColor: category.displayColor || PRESET_COLORS[0],
      icon: category.icon || PRESET_ICONS[0],
    });
    setMode('edit');
  };

  const handleDelete = async (category: CustomImageCategory) => {
    if (!confirm(t('booking.images.customCategories.deleteConfirm'))) return;

    try {
      await deleteMutation.mutateAsync(category.id);
      toast({
        title: t('booking.images.customCategories.deleteSuccess'),
        description: t('booking.images.customCategories.deleteSuccessDescription'),
      });
    } catch (error) {
      toast({
        title: t('booking.images.customCategories.deleteError'),
        description: error instanceof Error ? error.message : t('booking.images.customCategories.unknownError'),
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: t('booking.images.customCategories.nameRequired'),
        description: t('booking.images.customCategories.nameRequiredDescription'),
        variant: 'destructive',
      });
      return;
    }

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(formData);
        toast({
          title: t('booking.images.customCategories.createSuccess'),
          description: t('booking.images.customCategories.createSuccessDescription'),
        });
      } else if (mode === 'edit' && selectedCategory) {
        await updateMutation.mutateAsync({
          categoryId: selectedCategory.id,
          data: formData,
        });
        toast({
          title: t('booking.images.customCategories.updateSuccess'),
          description: t('booking.images.customCategories.updateSuccessDescription'),
        });
      }
      resetForm();
    } catch (error) {
      toast({
        title: mode === 'create' ? t('booking.images.customCategories.createError') : t('booking.images.customCategories.updateError'),
        description: error instanceof Error ? error.message : t('booking.images.customCategories.unknownError'),
        variant: 'destructive',
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  // Debug log to track mode changes
  console.log('Component render - mode:', mode, 'isLoading:', isLoading, 'isPending:', isPending);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] sm:w-full max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b">
          <DialogTitle className="text-xl sm:text-2xl">
            {mode === 'list' && t('booking.images.customCategories.title')}
            {mode === 'create' && t('booking.images.customCategories.createTitle')}
            {mode === 'edit' && t('booking.images.customCategories.editTitle')}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {mode === 'list' && t('booking.images.customCategories.subtitle')}
            {mode === 'create' && t('booking.images.customCategories.createSubtitle')}
            {mode === 'edit' && t('booking.images.customCategories.editSubtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {mode === 'list' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCreate();
                }} 
                size="sm"
                type="button"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('booking.images.customCategories.createNew')}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-2" role="status">
                    <span className="sr-only">{t('common.loading')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                </div>
              </div>
            ) : categoriesData?.categories && categoriesData.categories.length > 0 ? (
              <div className="space-y-3">
                {categoriesData.categories.map((category) => (
                  <div
                    key={category.id}
                    className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg hover:bg-accent/50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {category.displayColor && (
                        <div
                          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: category.displayColor }}
                        >
                          {category.icon ? (
                            (() => {
                              const IconComponent = getIconComponent(category.icon);
                              return <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />;
                            })()
                          ) : (
                            <span className="text-sm sm:text-base">{category.name.substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{category.name}</h3>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {t('booking.images.categories.custom')}
                          </Badge>
                        </div>
                        {category.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 self-end sm:self-center flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(category)}
                        className="flex-1 sm:flex-none"
                      >
                        <Edit className="h-4 w-4 sm:mr-2" />
                        <span className="sm:inline hidden">{t('common.edit')}</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(category)}
                        disabled={isPending}
                        className="flex-1 sm:flex-none"
                      >
                        <Trash2 className="h-4 w-4 sm:mr-2" />
                        <span className="sm:inline hidden">{t('common.delete')}</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-1">{t('booking.images.customCategories.noCategories')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('booking.images.customCategories.noCategoriesDescription')}
                </p>
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCreate();
                  }} 
                  size="sm" 
                  type="button"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('booking.images.customCategories.createNew')}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Name */}
            <div>
              <Label htmlFor="category-name" className="text-sm font-medium">{t('booking.images.customCategories.name')}</Label>
              <Input
                id="category-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('booking.images.customCategories.namePlaceholder')}
                className="mt-2"
                maxLength={100}
              />
              <p className="mt-1 text-xs text-muted-foreground">{formData.name.length}/100</p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="category-description" className="text-sm font-medium">{t('booking.images.customCategories.categoryDescription')}</Label>
              <Textarea
                id="category-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('booking.images.customCategories.descriptionPlaceholder')}
                className="mt-2 resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="mt-1 text-xs text-muted-foreground">{formData.description.length}/500</p>
            </div>

            {/* Color Picker */}
            <div>
              <Label className="text-sm font-medium">{t('booking.images.customCategories.color')}</Label>
              <div className="mt-3 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-9 gap-2 sm:gap-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, displayColor: color })}
                    className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full border-2 transition-all hover:scale-110 ${
                      formData.displayColor === color ? 'border-primary scale-110 ring-2 ring-primary/20' : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Icon Selector */}
            <div>
              <Label className="text-sm font-medium">{t('booking.images.customCategories.icon')}</Label>
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {PRESET_ICONS.map((icon) => {
                  const IconComponent = getIconComponent(icon);
                  return (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`h-12 sm:h-14 rounded-md border-2 transition-all hover:bg-accent flex flex-col items-center justify-center gap-1 ${
                        formData.icon === icon
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border hover:border-primary/50'
                      }`}
                      title={icon}
                    >
                      <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span className="text-[10px] sm:text-xs font-medium capitalize truncate px-1 max-w-full">{icon}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            <div>
              <Label className="text-sm font-medium">{t('booking.images.customCategories.preview')}</Label>
              <div className="mt-3 p-4 border-2 border-dashed rounded-lg bg-accent/30 flex items-center gap-3">
                <div
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-md"
                  style={{ backgroundColor: formData.displayColor }}
                >
                  {(() => {
                    const IconComponent = getIconComponent(formData.icon);
                    return <IconComponent className="h-6 w-6 sm:h-7 sm:w-7" />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base truncate">
                    {formData.name || t('booking.images.customCategories.previewPlaceholder')}
                  </h3>
                  {formData.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{formData.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>

        <DialogFooter className="px-4 sm:px-6 py-4 border-t bg-muted/30 flex-col sm:flex-row gap-2">
          {mode === 'list' ? (
            <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">{t('common.close')}</Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={resetForm} 
                disabled={isPending}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isPending || !formData.name.trim()}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {isPending
                  ? t('common.saving')
                  : mode === 'create'
                    ? t('booking.images.customCategories.create')
                    : t('booking.images.customCategories.update')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
