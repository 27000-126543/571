import requests
import time

BASE_URL = 'http://localhost:3001'

login_data = {'username': 'principal', 'password': '123456'}
r = requests.post(f'{BASE_URL}/api/auth/login', json=login_data)
token = r.json()['data']['token']
headers = {'Authorization': f'Bearer {token}'}

print('校车位置测试 (每4秒获取一次，共3次):')
print()

positions = []
for i in range(3):
    r = requests.get(f'{BASE_URL}/api/buses', headers=headers)
    buses = r.json()['data']
    positions.append(buses)
    
    print(f'第{i+1}次:')
    for b in buses[:3]:
        pos = b['position3D']
        print(f'  {b["busNumber"]}: x={pos["x"]:.2f}, z={pos["z"]:.2f}, next={b["nextStation"]}, status={b["status"]}')
    print()
    
    if i < 2:
        time.sleep(4)

print('位置变化分析:')
for i in range(3):
    b0 = positions[0][i]
    b2 = positions[2][i]
    dx = abs(b2['position3D']['x'] - b0['position3D']['x'])
    dz = abs(b2['position3D']['z'] - b0['position3D']['z'])
    changed = dx > 0.1 or dz > 0.1
    print(f'  {b0["busNumber"]}: dx={dx:.2f}, dz={dz:.2f}, 变化={"是" if changed else "否"}')
