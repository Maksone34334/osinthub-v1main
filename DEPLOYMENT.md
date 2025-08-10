# 🚀 ЭКСТРЕННЫЙ ДЕПЛОЙ - Исправления безопасности

## ⚠️ КРИТИЧНО! Действуйте немедленно:

### 1. **Настройка переменных окружения в Vercel**

Зайдите в Vercel Dashboard → Ваш проект → Settings → Environment Variables

#### Генерируйте безопасный секрет:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Добавьте переменные:
```
OSINT_SESSION_SECRET=ваш_64байтовый_секрет_здесь
OSINT_API_TOKEN=ваш_osint_api_токен
```

#### Создайте хешированные пароли:
```bash
# Локально запустите:
node scripts/hash-password.js вашПароль
```

#### Добавьте пользователей:
```
OSINT_USER_1=admin:соль:хеш:admin@domain.com:admin:active
OSINT_USER_2=user1:соль:хеш:user1@domain.com:user:active
```

### 2. **Push в GitHub репозиторий**

```bash
# Добавьте origin remote (замените на ваш репозиторий):
git remote add origin https://github.com/ваш-username/ваш-repo.git

# Push security fixes:
git push -u origin master

# Или если ваша ветка main:
git branch -M main  
git push -u origin main
```

### 3. **Vercel автоматически задеплоит**

- Vercel автоматически обнаружит изменения в GitHub
- Начнется новый build с исправлениями безопасности
- Проверьте Deployments в Vercel Dashboard

### 4. **Проверка деплоя**

```bash
# Проверьте статус в Vercel:
# - Dashboard → Deployments
# - Убедитесь что build прошел успешно
# - Проверьте что Environment Variables применились
```

## 🔄 Процесс обновления:

1. **Vercel получит push из GitHub**
2. **Запустится новый build с исправлениями**
3. **Применятся новые переменные окружения**
4. **Старые хардкоженные пароли больше не работают**
5. **Вход возможен только с новыми env переменными**

## ✅ После деплоя:

- [ ] Проверьте что старые пароли не работают
- [ ] Подтвердите вход с новыми учетными данными
- [ ] Убедитесь что NFT аутентификация работает
- [ ] Проверьте логи на ошибки

## 🆘 Если что-то пошло не так:

### Откат в Vercel:
1. Dashboard → Deployments  
2. Найдите предыдущий рабочий деплой
3. Нажмите "Promote to Production"

### Экстренная настройка:
```
OSINT_USER_1=emergency:temp:password:admin@temp.com:admin:active
```

## 🔐 Важные напоминания:

- ✅ NFT вход работает как прежде
- 🚫 Старые пароли полностью заблокированы  
- 🛡️ Все данные теперь в переменных окружения
- 📝 Ведите журнал всех изменений

---

**Статус:** 🚨 КРИТИЧЕСКИЕ ИСПРАВЛЕНИЯ ГОТОВЫ К ДЕПЛОЮ