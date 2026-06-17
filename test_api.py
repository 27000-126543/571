import requests
import json

BASE_URL = 'http://localhost:3001'

def main():
    login_data = {'username': 'principal', 'password': '123456'}
    r = requests.post(f'{BASE_URL}/api/auth/login', json=login_data)
    d = r.json()
    user = d['data']['user']
    token = d['data']['token']
    print(f'✓ 登录成功: {user["name"]} ({user["role"]})')
    print(f'  Token: {len(token)} chars')
    
    headers = {'Authorization': f'Bearer {token}'}
    
    print()
    print('=== API 测试 ===')
    
    apis = [
        ('/api/stats/kpi', 'KPI指标'),
        ('/api/classrooms', '教室列表'),
        ('/api/canteen/dishes', '食堂菜品'),
        ('/api/buses', '校车列表'),
        ('/api/devices', '设备台账'),
        ('/api/visitors', '访客列表'),
        ('/api/library/seats', '图书馆座位'),
        ('/api/approvals/todo', '审批待办'),
        ('/api/reports/daily?date=2026-06-17', '运营日报'),
        ('/api/logs?page=1&pageSize=10', '操作日志'),
    ]
    
    for path, name in apis:
        try:
            r = requests.get(f'{BASE_URL}{path}', headers=headers, timeout=10)
            d = r.json()
            code = d.get('code')
            data = d.get('data')
            count = len(data) if isinstance(data, list) else '-'
            status = '✓' if code == 0 else '✗'
            print(f'{status} {name}: code={code}, count={count}')
        except Exception as e:
            print(f'✗ {name}: {e}')
    
    print()
    print('=== Excel 导出测试 ===')
    try:
        r = requests.get(f'{BASE_URL}/api/reports/daily/export?date=2026-06-17', headers=headers, timeout=10)
        print(f'  HTTP状态: {r.status_code}')
        print(f'  Content-Type: {r.headers.get("Content-Type")}')
        print(f'  文件大小: {len(r.content)} bytes')
        if r.status_code == 200 and len(r.content) > 1000:
            print('  ✓ Excel导出成功')
            with open('/tmp/daily_report.xlsx', 'wb') as f:
                f.write(r.content)
            print('  已保存到 /tmp/daily_report.xlsx')
        else:
            print('  ✗ Excel导出失败')
            print(r.text[:200])
    except Exception as e:
        print(f'  ✗ 错误: {e}')

if __name__ == '__main__':
    main()
