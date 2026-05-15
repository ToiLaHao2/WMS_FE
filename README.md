# Warehouse Management System Simulation - WMSS (Frontend)

Dự án này là giao diện người dùng (Frontend) của hệ thống mô phỏng tự động hóa nhà kho đa ngôn ngữ (Polyglot Microservices). Nó mang đến một cái nhìn trực quan, sinh động (mang phong cách game 2D cổ điển) kết hợp với các bảng điều khiển nghiệp vụ chuyên nghiệp.

## 🎯 Concept & Mục tiêu của Ứng dụng

**WMSS (Warehouse Management System Simulation)** không chỉ là một ứng dụng quản lý kho thông thường, mà là một **"Bản sao kỹ thuật số" (Digital Twin)** thu nhỏ của một nhà kho thông minh tự động hoàn toàn (Fully Automated Warehouse).

- **Trực quan hóa thuật toán:** Giúp người xem nhìn thấy tận mắt cách các thuật toán tìm đường (A*) và phân bổ slot hoạt động thông qua sự di chuyển của hàng trăm chiếc xe tự hành (AGV).
- **Mô phỏng thời gian thực (Real-time):** Mọi sự thay đổi về lượng tồn kho, trạng thái xe AGV, các cảnh báo kẹt xe đều được phản hồi lên màn hình với độ trễ tính bằng mili-giây.
- **Tương tác nghiệp vụ:** Cung cấp đầy đủ các giao diện (UI) để người dùng thực hiện các thao tác nhập hàng, xuất hàng, theo dõi báo cáo tồn kho như một phần mềm ERP thực thụ.

## 🏗 Bức tranh Kiến trúc Tổng thể (The Big Picture)

Hệ thống WMSS được thiết kế theo kiến trúc Microservices phân tách ranh giới rõ ràng, và **Frontend (React/Phaser) chính là điểm cuối (Visualization Layer)** để hiển thị toàn bộ kết quả của bộ máy khổng lồ phía sau:

1. **Frontend (React/Phaser) - Visualization Layer:** Nơi tương tác và hiển thị (Dự án này). **Chỉ kết nối giao tiếp với duy nhất tầng WMS.**
2. **WMS (Node.js) - Business Layer:** Lớp "Kế hoạch & Nghiệp vụ" (Trả lời: *Cần làm gì?*). Là cổng giao tiếp (API Gateway + Socket) duy nhất cung cấp dữ liệu cho Frontend.
3. **MES (Python) - Decision Layer:** Lớp "Quyết định & Điều phối" (Trả lời: *Làm như thế nào?*). Chuyên xử lý tính toán thuật toán nặng, tìm đường A*, phân bổ kệ trống.
4. **AGV Control (Golang) - Execution Layer:** Lớp "Thực thi" (Trả lời: *Thực thi realtime ra sao?*). Nhận kế hoạch từ MES và điều khiển hàng loạt AGV giả lập thông qua Goroutines.

## 🛠 Tech Stack của Frontend

- **React:** Xây dựng phần Bảng điều khiển (Control Panel), hiển thị Data Grid, Form, và các chỉ số thống kê.
- **Phaser 3 (2D Game Engine):** Render trực quan cấu trúc vật lý của nhà kho (Kệ hàng, Cửa kho) và diễn hoạt sự di chuyển mượt mà của hàng loạt AGV.
- **Zustand:** Quản lý trạng thái cục bộ phía Client (Client State Management) như Theme, UI State.
- **TanStack Query:** Quản lý, cache, và đồng bộ dữ liệu nghiệp vụ (Products, Inventory) từ REST API của WMS.
- **Socket.io Client:** Lắng nghe luồng dữ liệu thời gian thực (vị trí AGV, event hoàn thành task) **thông qua WMS Socket Service**. Không kết nối trực tiếp với Golang hay Python.

## 📂 Cấu trúc Thư mục Định hướng

Để xử lý bài toán kết hợp giữa một UI Framework (React) và một Game Engine (Phaser), dự án áp dụng kiến trúc phân tách rõ ràng:

- `src/features/`: Chứa các Component React liên quan đến nghiệp vụ (VD: Panels, Forms, Data Grids quản lý AGV, Inventory).
- `src/simulation/`: Trái tim của Digital Twin. Chứa logic của Phaser 3 (Scenes, Renderers, Game Objects) hoàn toàn độc lập với React.
- `src/store/`: Nơi chứa các hook của Zustand để quản lý State dùng chung (UI State, Theme) và làm cầu nối dữ liệu giữa React và Phaser.
- `src/layout/`: Các thành phần khung sườn giao diện (Header, Sidebar, Main Workspace).

## 🚀 Hướng dẫn Cài đặt & Chạy dự án

### 1. Yêu cầu môi trường
- Node.js (phiên bản 18.x trở lên)
- Đảm bảo **WMS (Node.js Backend)** đang chạy ở port `3000` và Socket ở port `3001` để FE có thể lấy dữ liệu.

### 2. Cài đặt và Khởi chạy

```bash
# Di chuyển vào thư mục dự án
cd Warehouse_management_simulation_FE

# Cài đặt các gói phụ thuộc
npm install

# Khởi chạy server phát triển (Vite)
npm run dev
```

Ứng dụng sẽ mặc định chạy tại địa chỉ `http://localhost:5173`.
