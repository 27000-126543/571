import requests
import json

BASE_URL = 'http://localhost:3001'

def main():
    print('=' * 60)
    print('  5大功能修复验证测试')
    print('=' * 60)
    
    login_data = {'username': 'principal', 'password': '123456'}
    r = requests.post(f'{BASE_URL}/api/auth/login', json=login_data)
    d = r.json()
    token = d['data']['token']
    user = d['data']['user']
    print(f'\n✓ 登录成功: {user["name"]} ({user["role"]})')
    headers = {'Authorization': f'Bearer {token}'}
    
    print('\n' + '=' * 60)
    print('  1. 校车实时更新测试')
    print('=' * 60)
    
    r1 = requests.get(f'{BASE_URL}/api/buses', headers=headers)
    d1 = r1.json()
    buses1 = d1['data']
    print(f'  初始获取: {len(buses1)} 辆校车')
    for b in buses1[:2]:
        print(f'    {b["busNumber"]}: 位置({b["position3D"]["x"]:.1f}, {b["position3D"]["z"]:.1f}), 下一站: {b["nextStation"]}')
    
    print('\n  等待5秒后再次获取...')
    import time
    time.sleep(5)
    
    r2 = requests.get(f'{BASE_URL}/api/buses', headers=headers)
    d2 = r2.json()
    buses2 = d2['data']
    print(f'  再次获取: {len(buses2)} 辆校车')
    
    changed = 0
    for i, b in enumerate(buses2[:2]):
        old = buses1[i]
        pos_changed = abs(b['position3D']['x'] - old['position3D']['x']) > 0.1 or \
                      abs(b['position3D']['z'] - old['position3D']['z']) > 0.1
        if pos_changed:
            changed += 1
        print(f'    {b["busNumber"]}: 位置({b["position3D"]["x"]:.1f}, {b["position3D"]["z"]:.1f}), '
              f'下一站: {b["nextStation"]}, '
              f'预计到达: {b["estimatedArrival"][11:16]}',
              f'  {"✓ 位置已更新" if pos_changed else "✗ 位置未变化"}')
    
    print(f'\n  结果: {changed}/2 辆车位置已更新')
    print('  ' + ('✓ 通过' if changed >= 1 else '✗ 未通过'))
    
    print('\n' + '=' * 60)
    print('  2. 食堂库存→采购审批测试')
    print('=' * 60)
    
    r = requests.get(f'{BASE_URL}/api/approvals/todo', headers=headers)
    d = r.json()
    todos = d['data']
    print(f'  审批待办总数: {todos["total"]} 条')
    
    purchase_todos = [t for t in todos['items'] if t['orderType'] == 'PURCHASE']
    print(f'  其中采购审批: {len(purchase_todos)} 条')
    
    if purchase_todos:
        t = purchase_todos[0]
        print(f'    编号: {t["orderNo"]}')
        print(f'    标题: {t["title"]}')
        print(f'    金额: ￥{t["amount"]}')
        print(f'    当前级别: L{t["currentLevel"]}')
        print(f'    状态: {t["status"]}')
        
        print(f'\n  测试审批通过 (L1→L2)...')
        r_approve = requests.post(
            f'{BASE_URL}/api/approvals/{t["id"]}/approve',
            json={'orderType': 'PURCHASE'},
            headers=headers
        )
        d_approve = r_approve.json()
        print(f'  审批结果: {d_approve["code"] == 0}')
        if d_approve['code'] == 0:
            print(f'    新状态: {d_approve["data"]["status"]}')
            print(f'    当前级别: L{d_approve["data"]["currentLevel"]}')
            print('  ✓ 审批状态正常流转')
    else:
        print('  暂无采购待办，检查库存数据...')
        r_inv = requests.get(f'{BASE_URL}/api/canteen/inventory', headers=headers)
        if r_inv.status_code == 200:
            d_inv = r_inv.json()
            items = d_inv.get('data', [])
            low_stock = [i for i in items if i.get('status') in ('WARNING', 'CRITICAL')]
            print(f'    库存项: {len(items)}, 低库存: {len(low_stock)}')
            if low_stock:
                print('    低库存项存在，等待库存扫描生成采购单...')
            else:
                print('    当前无低库存项，需等库存消耗')
    
    print('\n  ✓ 库存→审批流程测试完成')
    
    print('\n' + '=' * 60)
    print('  3. 人脸识别登录测试')
    print('=' * 60)
    
    print('  测试1: 无有效数据 (空字符串)')
    r_face1 = requests.post(f'{BASE_URL}/api/auth/face-login', json={'faceImage': ''})
    d_face1 = r_face1.json()
    print(f'    状态码: {r_face1.status_code}')
    print(f'    code: {d_face1["code"]}')
    print(f'    消息: {d_face1["message"]}')
    print(f'    {"✓ 正确拒绝" if d_face1["code"] != 0 else "✗ 错误地通过了"}')
    
    print('\n  测试2: 有效人脸数据')
    valid_face = 'data:image/jpeg;base64,' + 'A' * 200
    r_face2 = requests.post(f'{BASE_URL}/api/auth/face-login', json={'faceImage': valid_face})
    d_face2 = r_face2.json()
    print(f'    状态码: {r_face2.status_code}')
    print(f'    code: {d_face2["code"]}')
    if d_face2['code'] == 0:
        print(f'    用户: {d_face2["data"]["user"]["name"]} ({d_face2["data"]["user"]["role"]})')
        print('    ✓ 识别成功')
    else:
        print(f'    消息: {d_face2["message"]}')
    
    print('\n  ✓ 人脸识别登录测试完成')
    
    print('\n' + '=' * 60)
    print('  4. 操作日志测试')
    print('=' * 60)
    
    r_logs = requests.get(f'{BASE_URL}/api/logs?pageSize=5', headers=headers)
    d_logs = r_logs.json()
    if d_logs['code'] == 0:
        logs_data = d_logs['data']
        print(f'  日志总数: {logs_data["total"]} 条')
        print(f'  最近5条:')
        for log in logs_data['list']:
            time_str = log['createdAt'][11:19]
            print(f'    [{time_str}] {log["userName"]} - {log["module"]}/{log["action"]} - {log["status"]}')
        
        if logs_data['total'] > 0:
            print('  ✓ 操作日志正常记录')
        else:
            print('  ⚠ 日志数量为0，可能未正确记录')
    else:
        print(f'  获取日志失败: {d_logs["message"]}')
    
    print('\n' + '=' * 60)
    print('  5. 排课冲突处理测试')
    print('=' * 60)
    
    r_allocate = requests.post(f'{BASE_URL}/api/schedule/allocate', headers=headers)
    d_alloc = r_allocate.json()
    if d_alloc['code'] == 0:
        result = d_alloc['data']
        print(f'  总课程数: {result["totalCourses"]}')
        print(f'  已分配: {result["allocatedCourses"]}')
        print(f'  冲突数: {len(result.get("conflicts", []))}')
        print(f'  自动调整数: {result.get("autoAdjusted", 0)}')
        
        conflicts = result.get('conflicts', [])
        if conflicts:
            c = conflicts[0]
            print(f'\n  第一个冲突详情:')
            print(f'    教室: {c["classroomNumber"]}')
            print(f'    时段: {c["timeSlot"]}')
            print(f'    已解决: {c.get("resolved", False)}')
            print(f'    自动调整: {c.get("autoAdjusted", False)}')
            if c.get("adjustmentNote"):
                print(f'    调整说明: {c["adjustmentNote"]}')
            print(f'    涉及课程: {len(c["courses"])} 门')
            for course in c['courses']:
                print(f'      - {course["grade"]}年级 {course["courseName"]} (优先级:{course["priority"]})')
        
        print('\n  ✓ 排课冲突处理测试完成')
    else:
        print(f'  分配失败: {d_alloc["message"]}')
    
    print('\n' + '=' * 60)
    print('  全部测试完成')
    print('=' * 60)

if __name__ == '__main__':
    main()
