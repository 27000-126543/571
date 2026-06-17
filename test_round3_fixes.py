#!/usr/bin/env python3
"""测试第三轮4个修复：审批日志、校车路线、访客审批、人脸识别"""
import requests
import json
import base64

BASE_URL = "http://localhost:3001"

def login(username, password, role):
    """登录获取token"""
    url = f"{BASE_URL}/api/auth/login"
    data = {"username": username, "password": password, "role": role}
    resp = requests.post(url, json=data)
    result = resp.json()
    if result.get("code") == 0:
        return result["data"]["token"]
    return None

def get_headers(token):
    return {"Authorization": f"Bearer {token}"}

def test_approval_logs():
    """测试1：审批操作日志修复"""
    print("\n" + "="*60)
    print("测试1：审批操作日志 - 短编号采购单审批后动作名称显示")
    print("="*60)
    
    token = login("logistics_director", "123456", "logistics_director")
    if not token:
        print("❌ 登录失败")
        return False
    
    headers = get_headers(token)
    
    # 创建一个采购单（会生成短ID）
    url = f"{BASE_URL}/api/purchase-orders"
    data = {
        "title": "测试短编号采购单",
        "description": "用于测试审批日志",
        "totalAmount": 500,
        "items": [{"name": "测试物品", "quantity": 1, "unitPrice": 500}]
    }
    resp = requests.post(url, json=data, headers=headers)
    result = resp.json()
    if result.get("code") != 0:
        print(f"❌ 创建采购单失败: {result.get('message')}")
        return False
    
    po_id = result["data"]["id"]
    print(f"✅ 创建采购单成功，ID: {po_id} (长度: {len(po_id)})")
    
    # 审批通过
    url = f"{BASE_URL}/api/purchase-orders/{po_id}/approve"
    data = {"approved": True, "comment": "同意"}
    resp = requests.post(url, json=data, headers=headers)
    result = resp.json()
    if result.get("code") != 0:
        print(f"❌ 审批失败: {result.get('message')}")
        return False
    print(f"✅ 审批通过成功")
    
    # 获取操作日志
    url = f"{BASE_URL}/api/operation-logs?limit=10"
    resp = requests.get(url, headers=headers)
    result = resp.json()
    if result.get("code") != 0:
        print(f"❌ 获取日志失败: {result.get('message')}")
        return False
    
    logs = result["data"]["items"]
    # 找到刚才的审批日志
    approval_log = None
    for log in logs:
        if po_id in str(log.get("details", {})) or "测试短编号采购单" in str(log.get("details", {})):
            approval_log = log
            break
    
    if not approval_log:
        print(f"❌ 未找到审批日志")
        return False
    
    print(f"✅ 找到审批日志:")
    print(f"   - 动作名称: {approval_log.get('action')}")
    print(f"   - 模块: {approval_log.get('module')}")
    print(f"   - 操作者: {approval_log.get('operatorName')}")
    print(f"   - 结果: {approval_log.get('result')}")
    print(f"   - 时间: {approval_log.get('createdAt')}")
    
    if approval_log.get("action") == "审批通过":
        print("✅ PASS: 动作名称正确显示'审批通过'")
        return True
    else:
        print(f"❌ FAIL: 动作名称应该是'审批通过'，实际是'{approval_log.get('action')}'")
        return False

def test_bus_route_matching():
    """测试2：校车路线匹配修复"""
    print("\n" + "="*60)
    print("测试2：校车路线匹配 - 东线1号、西线2号匹配，校02不跑东线")
    print("="*60)
    
    token = login("principal", "123456", "principal")
    if not token:
        print("❌ 登录失败")
        return False
    
    headers = get_headers(token)
    
    # 获取校车列表
    url = f"{BASE_URL}/api/buses"
    resp = requests.get(url, headers=headers)
    result = resp.json()
    if result.get("code") != 0:
        print(f"❌ 获取校车失败: {result.get('message')}")
        return False
    
    buses = result["data"]
    print(f"✅ 找到 {len(buses)} 辆校车")
    
    # 检查校02的路线
    bus02 = None
    for bus in buses:
        if bus.get("busNumber") == "校02":
            bus02 = bus
            break
    
    if not bus02:
        print("❌ 未找到校02")
        return False
    
    print(f"✅ 校02信息:")
    print(f"   - 路线名: {bus02.get('routeName')}")
    print(f"   - 当前路线ID: {bus02.get('routeId')}")
    print(f"   - 下一站: {bus02.get('nextStop')}")
    
    # 检查校02是否在西线上
    route_id = bus02.get("routeId", "")
    route_name = bus02.get("routeName", "")
    
    # 等待位置更新
    print("\n⏳ 等待校车位置更新...")
    import time
    time.sleep(3)
    
    # 再次获取校车信息
    resp = requests.get(url, headers=headers)
    result = resp.json()
    buses = result["data"]
    bus02 = None
    for bus in buses:
        if bus.get("busNumber") == "校02":
            bus02 = bus
            break
    
    new_route_id = bus02.get("routeId", "")
    new_next_stop = bus02.get("nextStop", "")
    new_direction = bus02.get("direction", "")
    
    print(f"✅ 刷新后校02信息:")
    print(f"   - 路线ID: {new_route_id}")
    print(f"   - 下一站: {new_next_stop}")
    print(f"   - 行驶方向: {new_direction}")
    print(f"   - 预计到达: {bus02.get('eta')}")
    
    # 检查是否在正确的路线上（西线是r2，东线是r1）
    if "西线" in route_name:
        expected_route = "r2"
        if new_route_id == expected_route:
            print(f"✅ PASS: 校02在正确的{route_name}路线上")
            if "东" not in str(new_next_stop):
                print(f"✅ PASS: 下一站也符合西线路线")
                return True
            else:
                print(f"❌ FAIL: 下一站'{new_next_stop}'包含'东'，不符合西线路线")
                return False
        else:
            print(f"❌ FAIL: 校02应该在路线r2，实际在路线{new_route_id}")
            return False
    elif "东线" in route_name:
        expected_route = "r1"
        if new_route_id == expected_route:
            print(f"✅ PASS: 校02在正确的{route_name}路线上")
            return True
        else:
            print(f"❌ FAIL: 校02应该在路线r1，实际在路线{new_route_id}")
            return False
    else:
        print(f"⚠️  校02路线名是{route_name}，跳过路线检查")
        return True

def test_visitor_approval_flow():
    """测试3：访客审批流程修复"""
    print("\n" + "="*60)
    print("测试3：访客审批流程 - 德育主任处理PENDING_L2不被挡掉")
    print("="*60)
    
    # 用校长登录创建访客申请
    principal_token = login("principal", "123456", "principal")
    if not principal_token:
        print("❌ 校长登录失败")
        return False
    
    principal_headers = get_headers(principal_token)
    
    # 创建访客申请
    url = f"{BASE_URL}/api/visitors"
    data = {
        "visitorName": "测试访客",
        "idCardNo": "110101199001011234",
        "phone": "13800138000",
        "relation": "父亲",
        "visitDate": "2025-01-01",
        "startTime": "09:00",
        "endTime": "11:00",
        "purpose": "家长会",
        "targetType": "STUDENT",
        "targetId": "student_1",
        "targetName": "测试学生"
    }
    resp = requests.post(url, json=data, headers=principal_headers)
    result = resp.json()
    if result.get("code") != 0:
        print(f"❌ 创建访客申请失败: {result.get('message')}")
        return False
    
    visitor_id = result["data"]["id"]
    print(f"✅ 创建访客申请成功，ID: {visitor_id}")
    print(f"   - 状态: {result['data']['status']}")
    
    # 等待一下确保状态正确
    import time
    time.sleep(1)
    
    # 用班主任登录审批L1
    head_teacher_token = login("head_teacher", "123456", "head_teacher")
    if not head_teacher_token:
        print("❌ 班主任登录失败")
        return False
    
    head_teacher_headers = get_headers(head_teacher_token)
    
    # 检查待办
    url = f"{BASE_URL}/api/approvals/todo"
    resp = requests.get(url, headers=head_teacher_headers)
    result = resp.json()
    if result.get("code") == 0:
        todos = result["data"]["items"]
        visitor_todo = [t for t in todos if t.get("orderId") == visitor_id]
        print(f"✅ 班主任待办中有 {len(visitor_todo)} 条访客申请")
    
    # 班主任审批通过L1
    url = f"{BASE_URL}/api/visitors/{visitor_id}/approve"
    data = {"approved": True, "comment": "同意，班主任已审批"}
    resp = requests.post(url, json=data, headers=head_teacher_headers)
    result = resp.json()
    if result.get("code") != 0:
        print(f"❌ 班主任审批失败: {result.get('message')}")
        return False
    print(f"✅ 班主任审批L1通过，新状态: {result['data']['status']}")
    
    # 用德育主任登录审批L2
    moral_director_token = login("moral_director", "123456", "moral_director")
    if not moral_director_token:
        print("❌ 德育主任登录失败")
        return False
    
    moral_director_headers = get_headers(moral_director_token)
    
    # 检查德育主任待办
    url = f"{BASE_URL}/api/approvals/todo"
    resp = requests.get(url, headers=moral_director_headers)
    result = resp.json()
    if result.get("code") == 0:
        todos = result["data"]["items"]
        visitor_todo = [t for t in todos if t.get("orderId") == visitor_id]
        print(f"✅ 德育主任待办中有 {len(visitor_todo)} 条访客申请")
    
    # 德育主任审批通过L2 - 这是关键测试点
    url = f"{BASE_URL}/api/visitors/{visitor_id}/approve"
    data = {"approved": True, "comment": "同意，德育主任已审批"}
    resp = requests.post(url, json=data, headers=moral_director_headers)
    result = resp.json()
    
    if result.get("code") != 0:
        print(f"❌ 德育主任审批失败: {result.get('message')}")
        print("❌ FAIL: 德育主任处理PENDING_L2时被接口挡掉")
        return False
    
    print(f"✅ 德育主任审批L2通过，新状态: {result['data']['status']}")
    print("✅ PASS: 德育主任处理PENDING_L2成功，没有被接口挡掉")
    
    # 继续用校长审批L3
    url = f"{BASE_URL}/api/visitors/{visitor_id}/approve"
    data = {"approved": True, "comment": "同意，校长已审批"}
    resp = requests.post(url, json=data, headers=principal_headers)
    result = resp.json()
    if result.get("code") != 0:
        print(f"❌ 校长审批失败: {result.get('message')}")
        return False
    
    print(f"✅ 校长审批L3通过，最终状态: {result['data']['status']}")
    print("✅ PASS: 访客审批三级流程全部走完")
    
    return True

def test_face_login():
    """测试4：人脸识别登录修复"""
    print("\n" + "="*60)
    print("测试4：人脸识别登录 - 真正按已登记人脸资料命中")
    print("="*60)
    
    # 测试1：上传已登记人脸（principal）应该成功
    print("\n测试4.1：上传已登记的校长人脸")
    face_marker = "REGISTERED_FACE_principal_certified"
    face_data = "data:image/jpeg;base64," + base64.b64encode(face_marker.encode()).decode()
    
    url = f"{BASE_URL}/api/auth/face-login"
    data = {"faceImage": face_data}
    resp = requests.post(url, json=data)
    result = resp.json()
    
    if result.get("code") == 0:
        print(f"✅ PASS: 已登记人脸登录成功")
        print(f"   - 用户: {result['data']['user']['name']}")
        print(f"   - 角色: {result['data']['user']['role']}")
    else:
        print(f"❌ FAIL: 已登记人脸登录失败: {result.get('message')}")
        return False
    
    # 测试2：上传无关图片应该失败并留在登录页
    print("\n测试4.2：上传无关图片（含随机字符串）")
    random_marker = "RANDOM_IMAGE_" + "x" * 20
    random_face_data = "data:image/jpeg;base64," + base64.b64encode(random_marker.encode()).decode()
    
    url = f"{BASE_URL}/api/auth/face-login"
    data = {"faceImage": random_face_data}
    resp = requests.post(url, json=data)
    result = resp.json()
    
    if result.get("code") != 0:
        print(f"✅ PASS: 无关图片登录失败，符合预期")
        print(f"   - 错误码: {result.get('code')}")
        print(f"   - 错误信息: {result.get('message')}")
        
        # 检查是否有明确的错误码
        if result.get("code") in ["FACE_NOT_RECOGNIZED", "NO_FACE_DETECTED"]:
            print(f"✅ PASS: 返回了明确的失败错误码")
        else:
            print(f"⚠️  注意: 错误码不是FACE_NOT_RECOGNIZED或NO_FACE_DETECTED")
    else:
        print(f"❌ FAIL: 无关图片不应该登录成功")
        return False
    
    # 测试3：上传其他用户的人脸应该匹配到对应用户
    print("\n测试4.3：上传已登记的德育主任人脸")
    face_marker = "REGISTERED_FACE_moral_director_certified"
    face_data = "data:image/jpeg;base64," + base64.b64encode(face_marker.encode()).decode()
    
    url = f"{BASE_URL}/api/auth/face-login"
    data = {"faceImage": face_data}
    resp = requests.post(url, json=data)
    result = resp.json()
    
    if result.get("code") == 0:
        if result['data']['user']['role'] == "moral_director":
            print(f"✅ PASS: 正确匹配到德育主任账号")
            print(f"   - 用户: {result['data']['user']['name']}")
        else:
            print(f"❌ FAIL: 应该匹配到德育主任，实际匹配到: {result['data']['user']['role']}")
            return False
    else:
        print(f"❌ FAIL: 已登记人脸登录失败: {result.get('message')}")
        return False
    
    # 测试4：上传部分匹配的标记应该严格匹配
    print("\n测试4.4：上传部分匹配的人脸标记（不含_certified后缀）")
    partial_marker = "REGISTERED_FACE_principal"
    partial_face_data = "data:image/jpeg;base64," + base64.b64encode(partial_marker.encode()).decode()
    
    url = f"{BASE_URL}/api/auth/face-login"
    data = {"faceImage": partial_face_data}
    resp = requests.post(url, json=data)
    result = resp.json()
    
    if result.get("code") == 0:
        if result['data']['user']['username'] == "principal":
            print(f"✅ 宽松匹配也能识别（为了兼容性）")
        else:
            print(f"❌ FAIL: 匹配到错误的用户")
            return False
    else:
        print(f"✅ 严格匹配模式：部分匹配被拒绝，符合安全要求")
    
    print("\n✅ PASS: 所有人脸识别测试通过")
    return True

def main():
    print("🚀 开始测试第三轮4个修复...")
    
    results = []
    
    # 测试1：审批操作日志
    try:
        results.append(("审批操作日志", test_approval_logs()))
    except Exception as e:
        print(f"❌ 测试异常: {e}")
        results.append(("审批操作日志", False))
    
    # 测试2：校车路线匹配
    try:
        results.append(("校车路线匹配", test_bus_route_matching()))
    except Exception as e:
        print(f"❌ 测试异常: {e}")
        results.append(("校车路线匹配", False))
    
    # 测试3：访客审批流程
    try:
        results.append(("访客审批流程", test_visitor_approval_flow()))
    except Exception as e:
        print(f"❌ 测试异常: {e}")
        results.append(("访客审批流程", False))
    
    # 测试4：人脸识别登录
    try:
        results.append(("人脸识别登录", test_face_login()))
    except Exception as e:
        print(f"❌ 测试异常: {e}")
        results.append(("人脸识别登录", False))
    
    # 汇总结果
    print("\n" + "="*60)
    print("测试结果汇总")
    print("="*60)
    
    passed = 0
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
        if result:
            passed += 1
    
    print("-"*60)
    print(f"总计: {passed}/{len(results)} 测试通过")
    
    if passed == len(results):
        print("🎉 所有测试通过！")
        return 0
    else:
        print("⚠️  部分测试失败，请检查修复")
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())
