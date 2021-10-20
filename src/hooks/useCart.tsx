import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = JSON.parse(localStorage.getItem('@RocketShoes:cart') || 'null');

    if (storagedCart) {
      return storagedCart;
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productToUpdate = cart.findIndex((product => product.id === productId));
      
      if(productToUpdate !== -1){
        const response = await api.get(`/stock/${productId}`);
        const amountUpdated = cart[productToUpdate].amount;
        
        if(amountUpdated + 1 <= response.data.amount){
          const newCart = [
            ...cart
          ];
          newCart[productToUpdate].amount += 1;
          setCart(newCart);

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        const response = await api.get(`/products/${productId}`);
        
        setCart([
          ...cart,
          {
            ...response.data,
            amount: 1,
          }
        ]);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify([
          ...cart,
          {
            ...response.data,
            amount: 1,
          }
        ]));
      }
      

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productToUpdate = cart.findIndex((product => product.id === productId));
      if(productToUpdate !== -1){
        const cartWithProductRemoved = cart.filter((product) => product.id !== productId);
        setCart(cartWithProductRemoved);
  
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartWithProductRemoved));
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount > 0){
        const productToUpdate = cart.findIndex((product => product.id === productId));
        const response = await api.get(`/stock/${productId}`);
        
        if(amount <= response.data.amount){
          const newCart = [
            ...cart
          ];
          newCart[productToUpdate].amount = amount;
          setCart(newCart);
  
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
