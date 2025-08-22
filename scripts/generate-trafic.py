import requests

BASE_URL = "http://localhost:3000/api/v1"

# Credenciales de prueba
USER = {
    "username": "testuser",
    "password": "secret123"
}

def signup():
    url = f"{BASE_URL}/auth/signup"
    r = requests.post(url, json=USER)
    print("Signup:", r.status_code, r.text)
    return r

def signin():
    url = f"{BASE_URL}/auth/signin"
    r = requests.post(url, json=USER)
    print("Signin:", r.status_code, r.text)
    try:
        data = r.json()
    except Exception:
        print("❌ Respuesta no es JSON")
        return None
    token = None
    if "access_token" in data:
        token = data["access_token"]
    elif "data" in data and isinstance(data["data"], dict) and "access_token" in data["data"]:
        token = data["data"]["access_token"]
    if r.status_code in [200, 201] and token:
        return token
    print("❌ No se pudo obtener token")
    return None

def create_book(token, title, author, publisher):
    url = f"{BASE_URL}/book"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "title": title,
        "author": author,
        "publisher": publisher
    }
    r = requests.post(url, json=payload, headers=headers)
    print("Create book:", r.status_code, r.text)
    return r

def get_books(token):
    url = f"{BASE_URL}/book"
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(url, headers=headers)
    print("Get books:", r.status_code, r.text)
    return r

if __name__ == "__main__":
    num_calls = 200
    for i in range(num_calls):
        USER["username"] = f"testuser{i+1}"
        signup()
        token = signin()
        if not token:
            print(f"❌ No se pudo obtener token en iteración {i+1}")
            continue
        create_book(token, f"Libro {i+1}", f"Autor {i+1}", f"Editorial {i+1}")
        get_books(token)
