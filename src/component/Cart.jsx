import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Pay.css'; 
import Header from './Header';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:3000/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems(response.data);
    } catch (error) {
      console.error('장바구니 항목을 가져오는 중 오류가 발생했습니다:', error);
    }
  };

  const handleRemoveItem = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.delete(`http://localhost:3000/cart/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCartItems(); // 항목 삭제 후 장바구니 목록 갱신
    } catch (error) {
      console.error('장바구니에서 항목을 제거하는 중 오류가 발생했습니다:', error);
    }
  };

  const handleQuantityChange = async (id, quantity) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      if (quantity < 1) {
        alert('수량은 1 이상이어야 합니다.');
        return;
      }

      await axios.put(
        `http://localhost:3000/cart/${id}`,
        { quantity },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchCartItems(); // 수량 변경 후 장바구니 목록 갱신
    } catch (error) {
      console.error('장바구니 수량을 변경하는 중 오류가 발생했습니다:', error);
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((itemId) => itemId !== id)
        : [...prevSelected, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(cartItems.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) {
      return '0';
    }
    return price.toLocaleString('ko-KR');
  };

  const totalPrice = selectedItems.reduce((total, itemId) => {
    const item = cartItems.find((item) => item.id === itemId);
    return item ? total + item.price * item.quantity : total;
  }, 0);

  const handleCheckout = () => {
    navigate('/payment');
  };

  return (
    <div>
        <Header />
    <div className="cart-container">
      <h2>My Cart</h2>
      <div className="cart-items">
        {cartItems.length > 0 ? (
          <>
            <div className="select-all-container">
              <input
                type="checkbox"
                id="select-all"
                checked={selectedItems.length === cartItems.length}
                onChange={handleSelectAll}
              />
              <label htmlFor="select-all">전체선택</label>
            </div>
            {cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleCheckboxChange(item.id)}
                />
                <img src={item.coverimage} alt={item.title} />
                <div className="cart-item-details">
                  <h3>{item.title}</h3>
                  <div className="quantity-container">
                    <label htmlFor={`quantity-${item.id}`}>수량: </label>
                    <input
                      type="number"
                      id={`quantity-${item.id}`}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                      min="1"
                    />
                  </div>
                  <p>₩{formatPrice(item.price)}</p>
                  <button className="remove-button" onClick={() => handleRemoveItem(item.id)}>
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </>
        ) : (
          <p>장바구니가 비었습니다.</p>
        )}
      </div>
      <div className="order-summary">
        <div>
          <p className="cart-total">전체금액: ₩{formatPrice(totalPrice)}</p>
        </div>
      </div>
      <div className="secure-checkout">
          <button onClick={handleCheckout}>
            결제하기
          </button>
      </div>
    </div>
    <footer className="main-footer">
     <p>&copy; 2024 Book Adventure. All rights reserved.</p>
    </footer>
    </div>
  );
};

export default Cart;
