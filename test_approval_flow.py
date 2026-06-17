import requests

BASE_URL = 'http://localhost:3001'

def test_user(username, password, role_name):
    login_data = {'username': username, 'password': password}
    r = requests.post(f'{BASE_URL}/api/auth/login', json=login_data)
    d = r.json()
    if d['code'] != 0:
        print(f'  登录失败: {d["message"]}')
        return
    
    token = d['data']['token']
    user = d['data']['user']
    headers = {'Authorization': f'Bearer {token}'}
    
    r_todo = requests.get(f'{BASE_URL}/api/approvals/todo', headers=headers)
    todo = r_todo.json()['data']
    
    print(f'  {user["name"]} ({role_name}): {todo["total"]} 条待办')
    for t in todo['items']:
        print(f'    - [{t["orderType"]}] {t.get("orderNo", "")} {t["title"]} (L{t["currentLevel"]})')
    
    return todo['items']

print('=== 三级审批待办验证 ===')
print()

print('后勤主任 (L1审批):')
l1_items = test_user('logistics01', '123456', 'L1-后勤主任')

print()
print('德育主任 (L2审批):')
l2_items = test_user('moral01', '123456', 'L2-德育主任')

print()
print('校长 (L3审批):')
l3_items = test_user('principal', '123456', 'L3-校长')

print()
print('=== 审批流转测试 ===')
print()

login_data = {'username': 'logistics01', 'password': '123456'}
r = requests.post(f'{BASE_URL}/api/auth/login', json=login_data)
token_l1 = r.json()['data']['token']
headers_l1 = {'Authorization': f'Bearer {token_l1}'}

purchase_items = [t for t in l1_items if t['orderType'] == 'PURCHASE']
if purchase_items:
    t = purchase_items[0]
    print(f'L1审批通过: {t["orderNo"]}')
    r_approve = requests.post(
        f'{BASE_URL}/api/approvals/{t["id"]}/approve',
        json={'orderType': 'PURCHASE'},
        headers=headers_l1
    )
    result = r_approve.json()
    if result['code'] == 0:
        print(f'  新状态: {result["data"]["status"]}, 新级别: L{result["data"]["currentLevel"]}')
        print('  ✓ L1→L2 流转成功')
        
        print()
        print('L2审批通过:')
        login_data2 = {'username': 'moral01', 'password': '123456'}
        r2 = requests.post(f'{BASE_URL}/api/auth/login', json=login_data2)
        token_l2 = r2.json()['data']['token']
        headers_l2 = {'Authorization': f'Bearer {token_l2}'}
        
        r_approve2 = requests.post(
            f'{BASE_URL}/api/approvals/{t["id"]}/approve',
            json={'orderType': 'PURCHASE'},
            headers=headers_l2
        )
        result2 = r_approve2.json()
        if result2['code'] == 0:
            print(f'  新状态: {result2["data"]["status"]}, 新级别: L{result2["data"]["currentLevel"]}')
            print('  ✓ L2→L3 流转成功')
            
            print()
            print('L3审批通过:')
            login_data3 = {'username': 'principal', 'password': '123456'}
            r3 = requests.post(f'{BASE_URL}/api/auth/login', json=login_data3)
            token_l3 = r3.json()['data']['token']
            headers_l3 = {'Authorization': f'Bearer {token_l3}'}
            
            r_approve3 = requests.post(
                f'{BASE_URL}/api/approvals/{t["id"]}/approve',
                json={'orderType': 'PURCHASE'},
                headers=headers_l3
            )
            result3 = r_approve3.json()
            if result3['code'] == 0:
                print(f'  最终状态: {result3["data"]["status"]}')
                print('  ✓ 三级审批全部通过')
            else:
                print(f'  ✗ L3审批失败: {result3["message"]}')
        else:
            print(f'  ✗ L2审批失败: {result2["message"]}')
    else:
        print(f'  ✗ L1审批失败: {result["message"]}')
else:
    print('没有找到采购审批待办')
