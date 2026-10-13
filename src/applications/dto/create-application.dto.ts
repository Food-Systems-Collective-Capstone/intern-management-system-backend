import { IsString, IsEmail, IsNotEmpty, IsInt, IsDateString, IsUrl, Matches } from 'class-validator';

export class CreateApplicationDto {
  @IsString() //Checks if value IsString
  @IsNotEmpty() //Checks if value is NOT empty
  firstname: string;

  @IsString()
  @IsNotEmpty()
  lastname: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  university: string;

  @IsString()
  @IsNotEmpty()
  degree: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  post_code: string;

  @IsInt()
  @IsNotEmpty()
  graduation_year: number;

  @IsString()
  @IsNotEmpty()
  motivation: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsDateString()
  date_of_birth: string;

  @IsUrl({protocols: ['https'], require_protocol: true})
  @Matches(/^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/.+/i,{
    message: 'linkedin_url must be a LinkedIn Profile Link'
  })
  linkedin_url: string;
}
