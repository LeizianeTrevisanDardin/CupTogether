export type Coffee = {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string | null;
  coffeeShop: string;
  order: string;
  rating: number;
  thoughts: string;
  createdAt?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  // null / undefined = compartilhado com Everyone
  groupId?: string | null;
};

export type NewCoffee = {
  userId: string;
  userName: string;
  coffeeShop: string;
  order: string;
  rating: number;
  thoughts: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  // null / undefined = Everyone
  groupId?: string | null;
};