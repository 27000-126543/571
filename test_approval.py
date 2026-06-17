import requests

BASE_URL = 'http://localhost:3001'

def main():
    login_data = {'username': 'principal', 'password': '123456'}
    r = requests.post(f'{BASE_URL}/api/auth/login', json=login_data)
    token = r.json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}

    print('=== 库存→采购审批流程测试 ===')
    print()

    r_todo_before = requests.get(f'{BASE_URL}/api/approvals/todo', headers=headers)
    todo_before = r_todo_before.json()['data']
    purchase_before = [t for t in todo_before['items'] if t['orderType'] == 'PURCHASE']
    print(f'扫描前采购待办: {len(purchase_before)} 条')
    for t in purchase_before:
        print(f'  - {t["orderNo"]}: {t["title"]} (L{t["currentLevel"]}, ￥{t["amount"]})')

    print()
    print('执行库存扫描...')
    r_scan = requests.post(f'{BASE_URL}/api/canteen/inventory/scan', headers=headers)
    scan_result = r_scan.json()['data']
    print(f'  预警项: {len(scan_result["warnings"])}')
    print(f'  紧急项: {len(scan_result["criticals"])}')

    if scan_result.get('purchaseOrder'):
        po = scan_result['purchaseOrder']
        print(f'  生成采购单: {po["orderNo"]}')
        print(f'    状态: {po["status"]}')
        print(f'    当前级别: L{po["currentLevel"]}')
        print(f'    金额: ￥{po["totalAmount"]}')
        print(f'    来源: {po.get("source", "N/A")}')
    else:
        print('  未生成新采购单')

    print()
    r_todo_after = requests.get(f'{BASE_URL}/api/approvals/todo', headers=headers)
    todo_after = r_todo_after.json()['data']
    purchase_after = [t for t in todo_after['items'] if t['orderType'] == 'PURCHASE']
    print(f'扫描后采购待办: {len(purchase_after)} 条')
    for t in purchase_after:
        print(f'  - {t["orderNo"]}: {t["title"]} (L{t["currentLevel"]}, ￥{t["amount"]})')

    if purchase_after:
        t = purchase_after[0]
        print()
        print(f'测试审批流程 (采购单 {t["orderNo"]})...')
        
        r_approve = requests.post(
            f'{BASE_URL}/api/approvals/{t["id"]}/approve',
            json={'orderType': 'PURCHASE'},
            headers=headers
        )
        result = r_approve.json()
        if result['code'] == 0:
            approved = result['data']
            print(f'  审批后状态: {approved["status"]}')
            print(f'  当前级别: L{approved["currentLevel"]}')
            
            if approved['status'] == 'APPROVED':
                print('  ✓ 已全部审批通过 (因为是校长账号L3直接通过)')
            elif approved['status'].startswith('PENDING_L'):
                print(f'  ✓ 已流转到下一级: {approved["status"]}')
        else:
            print(f'  ✗ 审批失败: {result["message"]}')

    print()
    print('=== 测试完成 ===')

if __name__ == '__main__':
    main()
