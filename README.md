# Warehouse Management Simulation Web App

Đây là dự án Web App mô phỏng quản lý kho hàng (Warehouse Management Simulation), được thiết kế với giao diện trực quan mang phong cách của một trò chơi cổ điển.

## 🛠 Công nghệ sử dụng

- **React**: Xây dựng giao diện người dùng (UI) chính của ứng dụng.
- **Phaser (2D Game Engine)**: Render và mô phỏng đồ họa không gian kho bãi.
- **Zustand**: Quản lý trạng thái phía client (Client State Management).
- **TanStack Query**: Quản lý trạng thái và đồng bộ dữ liệu từ server (Server State Management).
- **WebSocket / Socket.io**: Đảm bảo kết nối realtime tới lớp `AGV Control Service` để cập nhật trạng thái xe tự hành liên tục và độ trễ thấp.

## 🖥 Cấu trúc Giao diện (UI Layout)

Màn hình ứng dụng được chia thành 2 phần chính theo tỷ lệ **4:1**:

### 1. Phần Mô Phỏng Kho Bãi (Tỷ lệ 4/5 - Diện tích lớn bên trái)
- Sử dụng **Phaser** để render đồ họa 2D.
- Chịu trách nhiệm hiển thị trực quan các thành phần: bản đồ kho, các kệ hàng, các AGV (xe tự hành) đang di chuyển, trạm sạc,...

### 2. Phần Bảng Điều Khiển (Tỷ lệ 1/5 - Diện tích còn lại bên phải)
- Sử dụng các component của **React**.
- Là nơi chính chứa các chức năng tương tác và điều hành hệ thống:
  - **Nhập hàng / Trả hàng**: Quản lý luồng xuất nhập hàng hóa.
  - **Thống kê kho**: Theo dõi sức chứa, tồn kho theo thời gian thực.
  - **Nhật ký (Logs) hoạt động**: Hiển thị chi tiết log hoạt động của các thành phần trong kho.
  - **Quản lý AGV**: Kiểm tra trạng thái, thêm, xóa và điều phối các xe tự hành AGV.
