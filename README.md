# 🛍️ Local Artisan App

An e-commerce platform designed to help local artisans showcase and sell their handmade products online.

---

## 🚀 Features

* 🧑‍🎨 Artisan product listings
* 🛒 Shopping cart functionality
* 🔐 User authentication (login/register)
* 📦 Order management
* 🌐 REST API powered by Django
* ⚛️ Modern frontend built with React

---

## 🧱 Tech Stack

### Backend

* Django
* Django REST Framework
* Pipenv (environment management)

### Frontend

* React.js
* Vite
* JavaScript / CSS

---

## 📁 Project Structure

```
local-artisan-app/
│
├── Artisan/                # Django backend
│   ├── manage.py
│   └── ...
│
├── ecommerce_frontend/     # React frontend
│   ├── src/
│   └── ...
│
└── README.md
```

---

## ⚙️ Setup Instructions

### 🔹 Backend (Django)

```bash
cd Artisan
pipenv install
pipenv shell
python manage.py migrate
python manage.py runserver
```

---

### 🔹 Frontend (React)

```bash
cd ecommerce_frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file in your backend folder and add:

```
DEBUG=True
SECRET_KEY=your_secret_key
DATABASE_URL=your_database_url
```

---

## 📸 Screenshots

*(Add screenshots of your app here to make it more attractive)*

---

## 🤝 Contributing

Contributions are welcome!
Feel free to fork the repo and submit a pull request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Your Name**

* GitHub: https://github.com/yourusername

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
