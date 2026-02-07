#!/bin/bash

# สคริปต์สร้าง SSH Key สำหรับ DigitalOcean

echo "🔐 สร้าง SSH Key สำหรับ DigitalOcean"
echo ""

# ตรวจสอบว่า ~/.ssh directory มีอยู่หรือไม่
if [ ! -d ~/.ssh ]; then
    echo "📁 สร้าง ~/.ssh directory..."
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
fi

# ตรวจสอบว่า key มีอยู่แล้วหรือไม่
if [ -f ~/.ssh/truvamate_do ]; then
    echo "⚠️  SSH Key มีอยู่แล้ว: ~/.ssh/truvamate_do"
    read -p "ต้องการสร้างใหม่หรือไม่? (y/n): " answer
    if [ "$answer" != "y" ]; then
        echo "✅ ใช้ SSH Key เดิม"
        echo ""
        echo "📋 Public Key:"
        cat ~/.ssh/truvamate_do.pub
        echo ""
        echo "📋 Copy ไปยัง Clipboard (macOS):"
        echo "cat ~/.ssh/truvamate_do.pub | pbcopy"
        exit 0
    fi
fi

# สร้าง SSH Key
echo "🔑 กำลังสร้าง SSH Key..."
ssh-keygen -t ed25519 -C "truvamate-digitalocean" -f ~/.ssh/truvamate_do -N ""

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ สร้าง SSH Key สำเร็จ!"
    echo ""
    echo "📋 Public Key (ใช้ใส่ใน DigitalOcean):"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    cat ~/.ssh/truvamate_do.pub
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📋 Copy ไปยัง Clipboard (macOS):"
    echo "cat ~/.ssh/truvamate_do.pub | pbcopy"
    echo ""
    echo "📁 ไฟล์ที่สร้าง:"
    echo "  - Private Key: ~/.ssh/truvamate_do (เก็บไว้เป็นความลับ!)"
    echo "  - Public Key: ~/.ssh/truvamate_do.pub (ใช้ใส่ใน DigitalOcean)"
    echo ""
    echo "🔒 ตั้งค่า Permissions..."
    chmod 600 ~/.ssh/truvamate_do
    chmod 644 ~/.ssh/truvamate_do.pub
    echo "✅ ตั้งค่า Permissions สำเร็จ!"
    echo ""
    echo "🌐 ขั้นตอนต่อไป:"
    echo "1. Copy Public Key ด้านบน"
    echo "2. ไปที่ DigitalOcean → Create Droplet"
    echo "3. ในส่วน Authentication → New SSH Key"
    echo "4. Paste Public Key ที่ copy มา"
    echo "5. ตั้งชื่อ: Truvamate Server"
    echo "6. คลิก Add SSH Key"
    echo ""
else
    echo "❌ สร้าง SSH Key ไม่สำเร็จ"
    exit 1
fi