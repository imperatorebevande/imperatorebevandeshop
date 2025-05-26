
export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  features: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
}

export const products: Product[] = [
  {
    id: 1,
    name: "Smartphone Pro Max 256GB",
    price: 899.99,
    originalPrice: 1099.99,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop",
    category: "Elettronica",
    description: "Il nuovo smartphone di ultima generazione con fotocamera avanzata e prestazioni eccezionali.",
    features: ["Display 6.7\" OLED", "Tripla fotocamera 48MP", "Batteria 4500mAh", "5G Ready"],
    rating: 4.8,
    reviews: 324,
    inStock: true,
  },
  {
    id: 2,
    name: "Laptop Gaming Ultra 16GB",
    price: 1299.99,
    originalPrice: 1599.99,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop",
    category: "Computer",
    description: "Laptop potente per gaming e lavoro professionale con scheda grafica dedicata.",
    features: ["Intel i7 11th Gen", "RTX 3060", "16GB RAM", "512GB SSD"],
    rating: 4.6,
    reviews: 189,
    inStock: true,
  },
  {
    id: 3,
    name: "Cuffie Wireless Noise Cancelling",
    price: 199.99,
    originalPrice: 249.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
    category: "Audio",
    description: "Cuffie premium con cancellazione attiva del rumore e audio Hi-Fi.",
    features: ["30h autonomia", "Noise Cancelling", "Bluetooth 5.0", "Quick Charge"],
    rating: 4.7,
    reviews: 456,
    inStock: true,
  },
  {
    id: 4,
    name: "Smartwatch Fitness Pro",
    price: 249.99,
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=500&fit=crop",
    category: "Wearable",
    description: "Smartwatch avanzato per monitoraggio fitness e notifiche smart.",
    features: ["GPS integrato", "Monitor cardiaco", "Waterproof", "7 giorni autonomia"],
    rating: 4.5,
    reviews: 278,
    inStock: true,
  },
  {
    id: 5,
    name: "Tablet Pro 12.9\" 128GB",
    price: 799.99,
    originalPrice: 899.99,
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop",
    category: "Tablet",
    description: "Tablet professionale perfetto per creativi e professionisti.",
    features: ["Display Liquid Retina", "Apple Pencil support", "USB-C", "Face ID"],
    rating: 4.9,
    reviews: 145,
    inStock: true,
  },
  {
    id: 6,
    name: "Fotocamera Mirrorless 24MP",
    price: 1199.99,
    image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&h=500&fit=crop",
    category: "Fotografia",
    description: "Fotocamera mirrorless professionale per fotografi esperti.",
    features: ["24MP APS-C", "4K Video", "5-axis stabilization", "Weather sealed"],
    rating: 4.8,
    reviews: 92,
    inStock: false,
  },
  {
    id: 7,
    name: "Speaker Bluetooth Portatile",
    price: 79.99,
    originalPrice: 99.99,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop",
    category: "Audio",
    description: "Speaker portatile con suono potente e design resistente all'acqua.",
    features: ["360° sound", "IPX7 waterproof", "12h battery", "Voice assistant"],
    rating: 4.4,
    reviews: 667,
    inStock: true,
  },
  {
    id: 8,
    name: "Mouse Gaming RGB",
    price: 59.99,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop",
    category: "Gaming",
    description: "Mouse da gaming precision con illuminazione RGB personalizzabile.",
    features: ["16000 DPI", "RGB lighting", "Ergonomic design", "Programmable buttons"],
    rating: 4.3,
    reviews: 423,
    inStock: true,
  },
];

export const categories = [
  "Tutti",
  "Elettronica",
  "Computer",
  "Audio",
  "Wearable",
  "Tablet",
  "Fotografia",
  "Gaming",
];
