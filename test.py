import requests
import os
from dotenv import load_dotenv
from urllib3.exceptions import InsecureRequestWarning

load_dotenv()

# Ignorar verificación SSL solo en desarrollo
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

client_id = os.getenv("CLIENT_ID")
client_secret = os.getenv("CLIENT_SECRET")

#print("Probando con:")
#print("CLIENT_ID:", client_id)
#print("CLIENT_SECRET:", client_secret)

url = "https://apiqagetnet.palumbo.cl/api/getnetpos/authtrade"
headers = {
    "Content-Type": "application/json"
}
body = {
    "clientId": client_id,
    "clientSecret": client_secret
}

response = requests.post(url, headers=headers, json=body, verify=False)


#print("Código de respuesta:", response.status_code)
#print("Respuesta:", response.text)

token = response.json().get("accessToken")  # O ajusta según cómo venga el token real

poll_url = "https://apiqagetnet.palumbo.cl/api/getnetpos/postxs/poll"



body = {
    "idTerminal": "80000429",
    "idSucursal": 14308,
    "serialNumber": "1852398234",
    "command": 106
}

poll_response = requests.post(poll_url, headers=headers, json=body, verify=False)
print("Poll - Código de respuesta:", poll_response.status_code)
print("Poll - Respuesta JSON:", poll_response.json())
