import ViewCourse from "@/components/site/courses/view-course";

export default async function CoursePage({ params }) {
  const { slug } = await params;
  
  return <ViewCourse courseId={slug} />;
}