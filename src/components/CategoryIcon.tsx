import React from 'react';
import {
  Utensils,
  Hotel,
  Plane,
  Fuel,
  ShoppingCart,
  Ticket,
  ShoppingBag,
  Coins,
  Coffee,
  Car,
  Compass,
  Camera,
  Beer,
  Gift,
  Heart,
  Music,
  MapPin,
  Tag,
  Luggage,
  Shield,
  Smartphone,
  Bus,
  Train,
  Wine,
  Film,
  Sparkles,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

const ICON_MAP: Record<string, React.FC<{ className?: string; size?: number }>> = {
  Utensils,
  Hotel,
  Plane,
  Fuel,
  ShoppingCart,
  Ticket,
  ShoppingBag,
  Coins,
  Coffee,
  Car,
  Compass,
  Camera,
  Beer,
  Gift,
  Heart,
  Music,
  MapPin,
  Tag,
  Luggage,
  Shield,
  Smartphone,
  Bus,
  Train,
  Wine,
  Film,
  Sparkles,
};

export const AVAILABLE_ICON_NAMES = Object.keys(ICON_MAP);

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', size = 20 }) => {
  const IconComponent = ICON_MAP[name] || Coins;
  return <IconComponent className={className} size={size} />;
};
