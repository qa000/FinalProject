import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Main from './Main';
import BookMain from './component/BookMain';
import BookInfo from './component/BookInfo';
import Concert from './component/Concert';
import BookShop from './component/BookShop';
import Login from './component/Login'
import Join from './component/Join';
import BoardWrite from './component/BoardWrite';
import BookBoard from './component/BookBoard';
import MyPage from './component/MyPage';
import BoardView from './component/BoardView';
import BoardModify from './component/BoardModify';
import { ThemeProvider } from './contexts/ThemeContext'; 
import PlaylistPage from './component/PlaylistsPage';
import PlaylistDP from './component/PlaylistDP';
import BookPLI from './component/BookPLI';
import Chat from './component/Chat';
import Cart from './component/Cart';
import Payment from './component/Payment';
import Seat from './component/Seat';
import UserEdit from './component/UserEdit'; 
import MeetingList from './component/MeetingList';
import MeetingView from './component/MeetingView';
import MeetingForm from './component/MeetingForm';
import MeetingModify from './component/MeetingModify';
import UsedBookWrite from './component/UsedBookWrite';
import UsedBookInfo from './component/UsedBookInfo';
import UsedBookShop from './component/UsedBookShop';
import ChatRoom from './component/ChatRoom';
import AdminChatRoom from './component/AdminChatRoom';
import Admin from './component/Admin';
import GChat from './component/GChat';
import CreateConcert from './component/CreateConcert';
import EditConcert from './component/EditConcert';
import Contact from './component/Contact';



export default function App() {
  return (
    <ThemeProvider>
    <div className="App">
      <BrowserRouter>
      <Routes>
      <Route path="/" element={<Main /> } />
      <Route path="/main" element={<BookMain /> } />
      <Route path="/book" element={<BookInfo /> } />
      <Route path="/board" element={<BookBoard /> } />
      <Route path="/write" element={<BoardWrite /> } />
      <Route path="/concert" element={<Concert /> } />
      <Route path="/book/view/:itemid" element={<BookShop />} />
      <Route path="/login" element={<Login /> } />
      <Route path="/join" element={<Join /> } />
      <Route path="/mypage" element={<MyPage /> } />
      <Route path="/board/view/:bnum" element={<BoardView />} />
      <Route path="/board/modify/:bnum" element={<BoardModify />} />
      <Route path="/playlists" element={<PlaylistPage />} />
      <Route path="/playlists/:id" element={<PlaylistDP />} />
      <Route path="/bookpli" element={<BookPLI />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/payment" element={<Payment />} />
      <Route path="/seat" element={<Seat />} />
      <Route path="/edit" element={<UserEdit />} />
      <Route path="/playlist/:id" element={<PlaylistDP />} />
      <Route path="/meeting" element={<MeetingList />} />
      <Route path="/meeting/:id" element={<MeetingView />} />
      <Route path="/create-meeting" element={<MeetingForm />} />
      <Route path="/meeting/modify/:id" element={<MeetingModify />} />
      <Route path="/chatroom" element={<ChatRoom />} /> 
      <Route path="/admin/chatroom" element={<AdminChatRoom />} />
      <Route path="/UsedBookWrite" element={<UsedBookWrite />} />
      <Route path="/UsedBookInfo" element={<UsedBookInfo />} />
      <Route path="/used_book/view/:book_id" element={<UsedBookShop />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/gchat" element={<GChat />} />
      <Route path="/create-concert" element={<CreateConcert />} />
      <Route path="/edit-concert/:id" element={<EditConcert  />} />
      <Route path="/contact" element={<Contact  />} />
      </Routes>
      </BrowserRouter>
     </div>
  </ThemeProvider>
  );
}
