'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Plus, X } from 'lucide-react';

// 임시 사용자 데이터 (백엔드 연동 전까지 플레이스홀더)
const initialUser = {
  nickname: '스팟러버',
  profileImageUrl: '',
  interests: ['야구', '카페'],
  age: 28,
  gender: '남성' as '남성' | '여성' | '선택안함',
};

export default function ProfileModifyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState<string>(initialUser.nickname);
  const [profileImageUrl, setProfileImageUrl] = useState<string>(
    initialUser.profileImageUrl
  );
  const [interests, setInterests] = useState<string[]>([
    ...initialUser.interests,
  ]);
  const [newInterest, setNewInterest] = useState<string>('');
  const [age, setAge] = useState<number | ''>(initialUser.age ?? '');
  const [gender, setGender] = useState<'남성' | '여성' | '선택안함'>(
    initialUser.gender
  );
  const [errors, setErrors] = useState<{
    nickname?: string;
    interest?: string;
    age?: string;
  }>({});

  const onBack = () => router.back();

  const onClickImage = () => fileInputRef.current?.click();

  const onChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfileImageUrl(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const validateNickname = (value: string) => {
    if (value.trim().length < 2) return '닉네임은 2자 이상이어야 합니다.';
    if (value.trim().length > 10) return '닉네임은 10자 이하여야 합니다.';
    return '';
  };

  const onChangeNickname = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    const msg = validateNickname(value);
    setErrors((prev) => ({ ...prev, nickname: msg || undefined }));
  };

  const onAddInterest = () => {
    const value = newInterest.trim();
    if (!value) return;
    if (value.length > 10) {
      setErrors((p) => ({ ...p, interest: '태그는 10자 이하여야 합니다.' }));
      return;
    }
    if (interests.includes(value)) {
      setErrors((p) => ({ ...p, interest: '이미 추가된 태그입니다.' }));
      return;
    }
    if (interests.length >= 10) {
      setErrors((p) => ({
        ...p,
        interest: '태그는 최대 10개까지 가능합니다.',
      }));
      return;
    }
    setInterests((prev) => [...prev, value]);
    setNewInterest('');
    setErrors((p) => ({ ...p, interest: undefined }));
  };

  const onRemoveInterest = (idx: number) => {
    setInterests((prev) => prev.filter((_, i) => i !== idx));
  };

  const onChangeAge = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      setAge('');
      setErrors((p) => ({ ...p, age: undefined }));
      return;
    }
    const num = Number(raw);
    if (Number.isNaN(num)) return;
    setAge(num);
    if (num < 13 || num > 100) {
      setErrors((p) => ({ ...p, age: '나이는 13~100 사이여야 합니다.' }));
    } else {
      setErrors((p) => ({ ...p, age: undefined }));
    }
  };

  const isFormValid = () => {
    const nickErr = validateNickname(nickname);
    if (nickErr) return false;
    if (typeof age === 'number' && (age < 13 || age > 100)) return false;
    return true;
  };

  const onSave = () => {
    if (!isFormValid()) return;
    // TODO: 백엔드 연동 시 Firestore/Storage 업데이트
    router.push('/profile');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">프로필 수정</h1>
          <button
            onClick={onSave}
            disabled={!isFormValid()}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isFormValid()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            저장
          </button>
        </div>
      </header>

      {/* 본문 */}
      <div className="px-4">
        <div className="max-w-md mx-auto space-y-4 py-4">
          {/* 프로필 사진 */}
          <section className="bg-white rounded-lg p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              프로필 사진
            </h2>
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={onClickImage}
                className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center hover:opacity-90"
              >
                {profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profileImageUrl}
                    alt="프로필"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white bg-gradient-to-br from-blue-500 to-purple-500 w-full h-full flex items-center justify-center">
                    {nickname.charAt(0) || 'N'}
                  </span>
                )}
              </button>
              <button
                onClick={onClickImage}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
              >
                <Camera className="w-4 h-4" />
                사진 변경
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onChangeFile}
                className="hidden"
              />
            </div>
          </section>

          {/* 닉네임 */}
          <section className="bg-white rounded-lg p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              닉네임
            </h2>
            <input
              value={nickname}
              onChange={onChangeNickname}
              maxLength={10}
              placeholder="닉네임을 입력하세요 (2~10자)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-500">
                {nickname.trim().length}/10자
              </span>
              {errors.nickname ? (
                <span className="text-sm text-red-500">{errors.nickname}</span>
              ) : null}
            </div>
          </section>

          {/* 관심사 태그 */}
          <section className="bg-white rounded-lg p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              관심사 태그
            </h2>
            <div className="flex gap-2">
              <input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                maxLength={10}
                placeholder="관심사를 입력하세요 (1~10자)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddInterest();
                  }
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
              <button
                onClick={onAddInterest}
                disabled={!newInterest.trim()}
                className="px-4 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-600"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {errors.interest ? (
              <p className="text-sm text-red-500 mt-2">{errors.interest}</p>
            ) : null}
            <div className="flex flex-wrap gap-2 mt-3">
              {interests.map((tag, idx) => (
                <span
                  key={`${tag}-${idx}`}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700"
                >
                  {tag}
                  <button
                    onClick={() => onRemoveInterest(idx)}
                    className="ml-1 hover:text-red-600"
                    aria-label={`${tag} 삭제`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {interests.length}/10개
            </p>
          </section>

          {/* 개인정보 (선택) */}
          <section className="bg-white rounded-lg p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              개인정보 (선택)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">나이</label>
                <input
                  type="number"
                  value={age}
                  onChange={onChangeAge}
                  min={13}
                  max={100}
                  placeholder="나이를 입력하세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                />
                {errors.age ? (
                  <p className="text-sm text-red-500 mt-1">{errors.age}</p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">성별</label>
                <div className="flex gap-4">
                  {(['남성', '여성', '선택안함'] as const).map((g) => (
                    <label
                      key={g}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={gender === g}
                        onChange={() => setGender(g)}
                        className="w-4 h-4 text-blue-600"
                      />
                      {g}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-16" />
    </div>
  );
}
