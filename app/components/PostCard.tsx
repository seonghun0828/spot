import Image from 'next/image';
import { MapPin } from 'lucide-react';

interface PostCardProps {
  id: string;
  title: string;
  author: {
    nickname: string;
    profileImage?: string;
  };
  distance: number;
  image?: string;
  onClick: () => void;
}

export default function PostCard({
  id,
  title,
  author,
  distance,
  image,
  onClick,
}: PostCardProps) {
  const formatDistance = (distance: number) => {
    if (distance < 100) return `${Math.round(distance)}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex space-x-4">
        {/* 포스트 이미지 */}
        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
          {image ? (
            <Image
              src={image}
              alt={title}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <span className="text-gray-400 text-xs">이미지 없음</span>
            </div>
          )}
        </div>

        {/* 포스트 정보 */}
        <div className="flex-1 min-w-0">
          {/* 제목 */}
          <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-1">
            {title}
          </h3>

          {/* 작성자 정보와 거리 */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {author.profileImage ? (
                <Image
                  src={author.profileImage}
                  alt={author.nickname}
                  width={16}
                  height={16}
                  className="w-4 h-4 rounded-full"
                />
              ) : (
                <div className="w-4 h-4 bg-gray-300 rounded-full" />
              )}
              <span className="text-xs text-gray-600">{author.nickname}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                {formatDistance(distance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
